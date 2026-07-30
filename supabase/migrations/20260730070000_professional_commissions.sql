alter table public.professionals
  add column commission_percent numeric(5,2) not null default 0
    check (commission_percent between 0 and 100);

alter table public.financial_entries
  add column professional_id uuid references public.professionals (id) on delete set null,
  add column commission_percent numeric(5,2) not null default 0
    check (commission_percent between 0 and 100),
  add column commission_amount_cents integer not null default 0
    check (commission_amount_cents >= 0);

create index financial_entries_professional_occurred_idx
  on public.financial_entries (professional_id, occurred_at desc)
  where professional_id is not null;

create function public.snapshot_appointment_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_professional_id uuid;
  current_commission_percent numeric(5,2);
begin
  if new.type = 'income' and new.appointment_id is not null then
    select
      appointments.professional_id,
      professionals.commission_percent
    into
      appointment_professional_id,
      current_commission_percent
    from public.appointments
    join public.professionals
      on professionals.id = appointments.professional_id
    where appointments.id = new.appointment_id;

    new.professional_id := appointment_professional_id;
    new.commission_percent := coalesce(current_commission_percent, 0);
    new.commission_amount_cents :=
      round(new.amount_cents * coalesce(current_commission_percent, 0) / 100.0)::integer;
  end if;

  return new;
end;
$$;

create trigger financial_entries_snapshot_commission
  before insert on public.financial_entries
  for each row execute function public.snapshot_appointment_commission();

update public.financial_entries
set
  professional_id = appointments.professional_id,
  commission_percent = professionals.commission_percent,
  commission_amount_cents =
    round(financial_entries.amount_cents * professionals.commission_percent / 100.0)::integer
from public.appointments
join public.professionals
  on professionals.id = appointments.professional_id
where financial_entries.appointment_id = appointments.id
  and financial_entries.type = 'income';

create policy "Professionals can read their commission entries"
  on public.financial_entries for select
  to authenticated
  using (
    professional_id is not null
    and public.owns_professional(professional_id)
  );

create function public.update_professional_commission(
  target_professional_id uuid,
  new_commission_percent numeric
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
begin
  select establishment_id into target_establishment_id
  from public.professionals
  where id = target_professional_id;

  if target_establishment_id is null
    or not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if new_commission_percent < 0 or new_commission_percent > 100 then
    raise exception 'Invalid commission percentage';
  end if;

  update public.professionals
  set commission_percent = round(new_commission_percent, 2)
  where id = target_professional_id;

  return round(new_commission_percent, 2);
end;
$$;

create function public.protect_professional_commission()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.commission_percent is distinct from old.commission_percent
    and not public.can_manage_establishment(old.establishment_id) then
    raise exception 'Insufficient permission to change commission';
  end if;

  return new;
end;
$$;

create trigger professionals_protect_commission
  before update on public.professionals
  for each row execute function public.protect_professional_commission();

revoke all on function public.update_professional_commission(uuid, numeric) from public;
grant execute on function public.update_professional_commission(uuid, numeric) to authenticated;

