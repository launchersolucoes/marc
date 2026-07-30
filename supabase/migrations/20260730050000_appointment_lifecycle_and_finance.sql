create type public.payment_method as enum (
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'other'
);

create type public.financial_entry_type as enum (
  'income',
  'expense'
);

alter table public.appointments
  add column payment_method public.payment_method,
  add column completed_at timestamptz,
  add column cancelled_at timestamptz,
  add column cancellation_reason text;

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  appointment_id uuid unique references public.appointments (id) on delete set null,
  type public.financial_entry_type not null,
  category text not null,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  payment_method public.payment_method,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (type = 'expense' or payment_method is not null)
);

create index financial_entries_establishment_occurred_idx
  on public.financial_entries (establishment_id, occurred_at desc);

alter table public.financial_entries enable row level security;

create policy "Managers can read financial entries"
  on public.financial_entries for select
  to authenticated
  using (public.can_manage_establishment(establishment_id));

create policy "Managers can create financial entries"
  on public.financial_entries for insert
  to authenticated
  with check (public.can_manage_establishment(establishment_id));

grant select, insert on public.financial_entries to authenticated;

create function public.transition_appointment_status(
  target_appointment_id uuid,
  target_status public.appointment_status,
  target_payment_method public.payment_method default null,
  status_reason text default null
)
returns public.appointment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  appointment_record public.appointments%rowtype;
  service_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into appointment_record
  from public.appointments
  where id = target_appointment_id
  for update;

  if appointment_record.id is null then
    raise exception 'Appointment not found';
  end if;

  if not (
    public.can_operate_establishment(appointment_record.establishment_id)
    or public.owns_professional(appointment_record.professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  if not (
    (appointment_record.status = 'pending' and target_status in ('confirmed', 'cancelled'))
    or (appointment_record.status = 'confirmed' and target_status in ('in_progress', 'cancelled', 'no_show'))
    or (appointment_record.status = 'in_progress' and target_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid status transition';
  end if;

  if target_status = 'completed' and target_payment_method is null then
    raise exception 'Payment method required';
  end if;

  update public.appointments
  set
    status = target_status,
    payment_method = case when target_status = 'completed' then target_payment_method else payment_method end,
    completed_at = case when target_status = 'completed' then now() else completed_at end,
    cancelled_at = case when target_status in ('cancelled', 'no_show') then now() else cancelled_at end,
    cancellation_reason = case when target_status in ('cancelled', 'no_show') then nullif(trim(status_reason), '') else cancellation_reason end
  where id = target_appointment_id;

  insert into public.appointment_events (
    appointment_id,
    actor_user_id,
    event_type,
    payload
  )
  values (
    target_appointment_id,
    current_user_id,
    'status_changed',
    jsonb_build_object(
      'from', appointment_record.status,
      'to', target_status,
      'payment_method', target_payment_method,
      'reason', nullif(trim(status_reason), '')
    )
  );

  if target_status = 'completed' then
    select services.name into service_name
    from public.professional_services
    join public.services on services.id = professional_services.service_id
    where professional_services.id = appointment_record.professional_service_id;

    insert into public.financial_entries (
      establishment_id,
      appointment_id,
      type,
      category,
      description,
      amount_cents,
      payment_method,
      occurred_at,
      created_by
    )
    values (
      appointment_record.establishment_id,
      appointment_record.id,
      'income',
      'Atendimentos',
      coalesce(service_name, 'Atendimento concluído'),
      appointment_record.price_cents,
      target_payment_method,
      now(),
      current_user_id
    )
    on conflict (appointment_id) do nothing;
  end if;

  return target_status;
end;
$$;

create function public.create_financial_expense(
  target_establishment_id uuid,
  expense_description text,
  expense_category text,
  expense_amount_cents integer,
  expense_payment_method public.payment_method,
  local_occurred_at timestamp without time zone
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_entry_id uuid;
  establishment_timezone text;
begin
  if not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if length(trim(expense_description)) < 2 or expense_amount_cents <= 0 then
    raise exception 'Invalid expense';
  end if;

  select timezone into establishment_timezone
  from public.establishments
  where id = target_establishment_id;

  insert into public.financial_entries (
    establishment_id,
    type,
    category,
    description,
    amount_cents,
    payment_method,
    occurred_at,
    created_by
  )
  values (
    target_establishment_id,
    'expense',
    coalesce(nullif(trim(expense_category), ''), 'Outros'),
    trim(expense_description),
    expense_amount_cents,
    expense_payment_method,
    local_occurred_at at time zone establishment_timezone,
    (select auth.uid())
  )
  returning id into new_entry_id;

  return new_entry_id;
end;
$$;

revoke all on function public.transition_appointment_status(
  uuid, public.appointment_status, public.payment_method, text
) from public;
revoke all on function public.create_financial_expense(
  uuid, text, text, integer, public.payment_method, timestamp without time zone
) from public;

grant execute on function public.transition_appointment_status(
  uuid, public.appointment_status, public.payment_method, text
) to authenticated;
grant execute on function public.create_financial_expense(
  uuid, text, text, integer, public.payment_method, timestamp without time zone
) to authenticated;
