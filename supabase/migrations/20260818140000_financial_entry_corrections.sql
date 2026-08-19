alter table public.financial_entries
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users (id) on delete set null,
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by uuid references auth.users (id) on delete set null,
  add column if not exists void_reason text;

drop policy if exists "Managers can create financial entries" on public.financial_entries;
revoke insert on table public.financial_entries from authenticated;

alter table public.financial_entries
  drop constraint if exists financial_entries_void_reason_check;

alter table public.financial_entries
  add constraint financial_entries_void_reason_check check (
    (voided_at is null and void_reason is null)
    or (voided_at is not null and length(trim(void_reason)) between 3 and 240)
  );

create table if not exists public.financial_entry_events (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  financial_entry_id uuid not null references public.financial_entries (id) on delete restrict,
  event_type text not null check (event_type in ('updated', 'voided')),
  actor_user_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists financial_entry_events_entry_created_idx
  on public.financial_entry_events (financial_entry_id, created_at desc);

alter table public.financial_entry_events enable row level security;

drop policy if exists "Managers can read financial entry events" on public.financial_entry_events;
create policy "Managers can read financial entry events"
  on public.financial_entry_events for select
  to authenticated
  using (public.can_manage_establishment(establishment_id));

revoke all on table public.financial_entry_events from public, anon, authenticated;
grant select on table public.financial_entry_events to authenticated;

create or replace function public.update_manual_financial_expense(
  target_entry_id uuid,
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
  entry_record public.financial_entries%rowtype;
  establishment_timezone text;
  previous_values jsonb;
begin
  select * into entry_record
  from public.financial_entries
  where id = target_entry_id
  for update;

  if entry_record.id is null then
    raise exception 'Financial entry not found';
  end if;

  if not public.can_manage_establishment(entry_record.establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if entry_record.type <> 'expense' or entry_record.appointment_id is not null then
    raise exception 'Only manual expenses can be edited';
  end if;

  if entry_record.voided_at is not null then
    raise exception 'Voided expenses cannot be edited';
  end if;

  if length(trim(expense_description)) not between 2 and 160
    or length(coalesce(trim(expense_category), '')) > 60
    or expense_amount_cents <= 0
    or expense_amount_cents > 1000000000
    or local_occurred_at is null then
    raise exception 'Invalid expense';
  end if;

  select timezone into establishment_timezone
  from public.establishments
  where id = entry_record.establishment_id;

  previous_values := jsonb_build_object(
    'description', entry_record.description,
    'category', entry_record.category,
    'amount_cents', entry_record.amount_cents,
    'payment_method', entry_record.payment_method,
    'occurred_at', entry_record.occurred_at
  );

  update public.financial_entries
  set description = trim(expense_description),
      category = coalesce(nullif(trim(expense_category), ''), 'Outros'),
      amount_cents = expense_amount_cents,
      payment_method = expense_payment_method,
      occurred_at = local_occurred_at at time zone establishment_timezone,
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = entry_record.id;

  insert into public.financial_entry_events (
    establishment_id,
    financial_entry_id,
    event_type,
    actor_user_id,
    details
  ) values (
    entry_record.establishment_id,
    entry_record.id,
    'updated',
    (select auth.uid()),
    jsonb_build_object(
      'before', previous_values,
      'after', jsonb_build_object(
        'description', trim(expense_description),
        'category', coalesce(nullif(trim(expense_category), ''), 'Outros'),
        'amount_cents', expense_amount_cents,
        'payment_method', expense_payment_method,
        'occurred_at', local_occurred_at at time zone establishment_timezone
      )
    )
  );

  return entry_record.id;
end;
$$;

create or replace function public.void_manual_financial_expense(
  target_entry_id uuid,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  entry_record public.financial_entries%rowtype;
begin
  select * into entry_record
  from public.financial_entries
  where id = target_entry_id
  for update;

  if entry_record.id is null then
    raise exception 'Financial entry not found';
  end if;

  if not public.can_manage_establishment(entry_record.establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if entry_record.type <> 'expense' or entry_record.appointment_id is not null then
    raise exception 'Only manual expenses can be voided';
  end if;

  if entry_record.voided_at is not null then
    raise exception 'Expense already voided';
  end if;

  if length(trim(reason)) not between 3 and 240 then
    raise exception 'Invalid void reason';
  end if;

  update public.financial_entries
  set voided_at = now(),
      voided_by = (select auth.uid()),
      void_reason = trim(reason),
      updated_at = now(),
      updated_by = (select auth.uid())
  where id = entry_record.id;

  insert into public.financial_entry_events (
    establishment_id,
    financial_entry_id,
    event_type,
    actor_user_id,
    details
  ) values (
    entry_record.establishment_id,
    entry_record.id,
    'voided',
    (select auth.uid()),
    jsonb_build_object(
      'reason', trim(reason),
      'amount_cents', entry_record.amount_cents,
      'description', entry_record.description
    )
  );

  return entry_record.id;
end;
$$;

revoke all on function public.update_manual_financial_expense(
  uuid, text, text, integer, public.payment_method, timestamp without time zone
) from public;
revoke all on function public.void_manual_financial_expense(uuid, text) from public;

grant execute on function public.update_manual_financial_expense(
  uuid, text, text, integer, public.payment_method, timestamp without time zone
) to authenticated;
grant execute on function public.void_manual_financial_expense(uuid, text) to authenticated;
