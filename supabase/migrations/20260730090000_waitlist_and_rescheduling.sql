create type public.waitlist_status as enum (
  'waiting',
  'booked',
  'cancelled'
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  professional_service_id uuid not null references public.professional_services (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  preferred_date date not null,
  notes text,
  status public.waitlist_status not null default 'waiting',
  appointment_id uuid references public.appointments (id) on delete set null,
  booked_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index waitlist_entries_active_request_unique
  on public.waitlist_entries (
    establishment_id,
    professional_service_id,
    customer_id,
    preferred_date
  )
  where status = 'waiting';

create index waitlist_entries_establishment_status_date_idx
  on public.waitlist_entries (establishment_id, status, preferred_date, created_at);

create trigger waitlist_entries_set_updated_at
  before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

alter table public.waitlist_entries enable row level security;

create policy "Team can read waitlist in their scope"
  on public.waitlist_entries for select
  to authenticated
  using (
    public.can_operate_establishment(establishment_id)
    or exists (
      select 1
      from public.professional_services
      where professional_services.id = waitlist_entries.professional_service_id
        and public.owns_professional(professional_services.professional_id)
    )
  );

grant select on public.waitlist_entries to authenticated;

create function public.create_public_waitlist_entry(
  establishment_slug text,
  target_professional_service_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  target_preferred_date date,
  waitlist_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  customer_record_id uuid;
  new_waitlist_id uuid;
begin
  if length(trim(customer_name)) < 2
    or length(trim(customer_phone)) < 8
    or target_preferred_date < (now() at time zone 'America/Sao_Paulo')::date
    or target_preferred_date > (now() at time zone 'America/Sao_Paulo')::date + 60 then
    raise exception 'Invalid waitlist request';
  end if;

  select establishment.id into target_establishment_id
  from public.professional_services professional_service
  join public.professionals professional
    on professional.id = professional_service.professional_id
  join public.establishments establishment
    on establishment.id = professional.establishment_id
  join public.services service
    on service.id = professional_service.service_id
  where professional_service.id = target_professional_service_id
    and establishment.slug = establishment_slug
    and establishment.is_active
    and professional.is_active
    and professional_service.is_active
    and service.is_active;

  if target_establishment_id is null then
    raise exception 'Invalid service';
  end if;

  select id into customer_record_id
  from public.customers
  where establishment_id = target_establishment_id
    and phone = trim(customer_phone)
  limit 1;

  if customer_record_id is null then
    insert into public.customers (
      establishment_id,
      full_name,
      phone,
      email
    )
    values (
      target_establishment_id,
      trim(customer_name),
      trim(customer_phone),
      nullif(lower(trim(customer_email)), '')
    )
    returning id into customer_record_id;
  else
    update public.customers
    set
      full_name = trim(customer_name),
      email = coalesce(nullif(lower(trim(customer_email)), ''), email)
    where id = customer_record_id;
  end if;

  insert into public.waitlist_entries (
    establishment_id,
    professional_service_id,
    customer_id,
    preferred_date,
    notes
  )
  values (
    target_establishment_id,
    target_professional_service_id,
    customer_record_id,
    target_preferred_date,
    nullif(trim(waitlist_notes), '')
  )
  on conflict (
    establishment_id,
    professional_service_id,
    customer_id,
    preferred_date
  ) where status = 'waiting'
  do update set
    notes = coalesce(excluded.notes, waitlist_entries.notes),
    updated_at = now()
  returning id into new_waitlist_id;

  return new_waitlist_id;
end;
$$;

create function public.schedule_waitlist_entry(
  target_waitlist_id uuid,
  local_start timestamp without time zone
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  waitlist_record public.waitlist_entries%rowtype;
  target_professional_id uuid;
  service_duration integer;
  service_price integer;
  establishment_timezone text;
  appointment_start timestamptz;
  appointment_end timestamptz;
  local_end timestamp without time zone;
  new_appointment_id uuid;
begin
  select * into waitlist_record
  from public.waitlist_entries
  where id = target_waitlist_id
  for update;

  if waitlist_record.id is null or waitlist_record.status <> 'waiting' then
    raise exception 'Waitlist entry is not available';
  end if;

  select
    professional_service.professional_id,
    professional_service.duration_minutes,
    professional_service.price_cents,
    establishment.timezone
  into
    target_professional_id,
    service_duration,
    service_price,
    establishment_timezone
  from public.professional_services professional_service
  join public.professionals professional
    on professional.id = professional_service.professional_id
  join public.establishments establishment
    on establishment.id = professional.establishment_id
  where professional_service.id = waitlist_record.professional_service_id
    and professional.establishment_id = waitlist_record.establishment_id
    and professional.is_active
    and professional_service.is_active;

  if not (
    public.can_operate_establishment(waitlist_record.establishment_id)
    or public.owns_professional(target_professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  local_end := local_start + make_interval(mins => service_duration);
  appointment_start := local_start at time zone establishment_timezone;
  appointment_end := local_end at time zone establishment_timezone;

  if appointment_start <= now() then
    raise exception 'Invalid date';
  end if;

  if not exists (
    select 1
    from public.availability_rules
    where professional_id = target_professional_id
      and weekday = extract(dow from local_start)::smallint
      and starts_at <= local_start::time
      and ends_at >= local_end::time
      and (valid_from is null or valid_from <= local_start::date)
      and (valid_until is null or valid_until >= local_start::date)
  ) then
    raise exception 'Outside availability';
  end if;

  if exists (
    select 1
    from public.professional_time_off
    where professional_id = target_professional_id
      and tstzrange(starts_at, ends_at, '[)') &&
        tstzrange(appointment_start, appointment_end, '[)')
  ) then
    raise exception 'Time is blocked';
  end if;

  insert into public.appointments (
    establishment_id,
    professional_id,
    professional_service_id,
    customer_id,
    starts_at,
    ends_at,
    status,
    source,
    price_cents,
    notes,
    created_by
  )
  values (
    waitlist_record.establishment_id,
    target_professional_id,
    waitlist_record.professional_service_id,
    waitlist_record.customer_id,
    appointment_start,
    appointment_end,
    'confirmed',
    'public_booking',
    service_price,
    waitlist_record.notes,
    (select auth.uid())
  )
  returning id into new_appointment_id;

  insert into public.appointment_events (
    appointment_id,
    actor_user_id,
    event_type,
    payload
  )
  values (
    new_appointment_id,
    (select auth.uid()),
    'created_from_waitlist',
    jsonb_build_object('waitlist_id', waitlist_record.id)
  );

  update public.waitlist_entries
  set
    status = 'booked',
    appointment_id = new_appointment_id,
    booked_at = now()
  where id = waitlist_record.id;

  return new_appointment_id;
exception
  when exclusion_violation then
    raise exception 'Schedule conflict';
end;
$$;

create function public.cancel_waitlist_entry(target_waitlist_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  waitlist_record public.waitlist_entries%rowtype;
  target_professional_id uuid;
begin
  select * into waitlist_record
  from public.waitlist_entries
  where id = target_waitlist_id;

  select professional_id into target_professional_id
  from public.professional_services
  where id = waitlist_record.professional_service_id;

  if waitlist_record.id is null or not (
    public.can_operate_establishment(waitlist_record.establishment_id)
    or public.owns_professional(target_professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  update public.waitlist_entries
  set status = 'cancelled', cancelled_at = now()
  where id = target_waitlist_id
    and status = 'waiting';
end;
$$;

create function public.reschedule_appointment(
  target_appointment_id uuid,
  local_start timestamp without time zone
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  appointment_record public.appointments%rowtype;
  service_duration integer;
  establishment_timezone text;
  local_end timestamp without time zone;
  appointment_start timestamptz;
  appointment_end timestamptz;
begin
  select * into appointment_record
  from public.appointments
  where id = target_appointment_id
  for update;

  if appointment_record.id is null
    or appointment_record.status not in ('pending', 'confirmed') then
    raise exception 'Appointment cannot be rescheduled';
  end if;

  if not (
    public.can_operate_establishment(appointment_record.establishment_id)
    or public.owns_professional(appointment_record.professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  select
    professional_service.duration_minutes,
    establishment.timezone
  into
    service_duration,
    establishment_timezone
  from public.professional_services professional_service
  join public.professionals professional
    on professional.id = professional_service.professional_id
  join public.establishments establishment
    on establishment.id = professional.establishment_id
  where professional_service.id = appointment_record.professional_service_id;

  local_end := local_start + make_interval(mins => service_duration);
  appointment_start := local_start at time zone establishment_timezone;
  appointment_end := local_end at time zone establishment_timezone;

  if appointment_start <= now() then
    raise exception 'Invalid date';
  end if;

  if not exists (
    select 1
    from public.availability_rules
    where professional_id = appointment_record.professional_id
      and weekday = extract(dow from local_start)::smallint
      and starts_at <= local_start::time
      and ends_at >= local_end::time
      and (valid_from is null or valid_from <= local_start::date)
      and (valid_until is null or valid_until >= local_start::date)
  ) then
    raise exception 'Outside availability';
  end if;

  if exists (
    select 1
    from public.professional_time_off
    where professional_id = appointment_record.professional_id
      and tstzrange(starts_at, ends_at, '[)') &&
        tstzrange(appointment_start, appointment_end, '[)')
  ) then
    raise exception 'Time is blocked';
  end if;

  update public.appointments
  set starts_at = appointment_start, ends_at = appointment_end
  where id = appointment_record.id;

  insert into public.appointment_events (
    appointment_id,
    actor_user_id,
    event_type,
    payload
  )
  values (
    appointment_record.id,
    (select auth.uid()),
    'rescheduled',
    jsonb_build_object(
      'from_start', appointment_record.starts_at,
      'from_end', appointment_record.ends_at,
      'to_start', appointment_start,
      'to_end', appointment_end
    )
  );

  return appointment_start;
exception
  when exclusion_violation then
    raise exception 'Schedule conflict';
end;
$$;

revoke all on function public.create_public_waitlist_entry(
  text, uuid, text, text, text, date, text
) from public;
revoke all on function public.schedule_waitlist_entry(uuid, timestamp without time zone) from public;
revoke all on function public.cancel_waitlist_entry(uuid) from public;
revoke all on function public.reschedule_appointment(uuid, timestamp without time zone) from public;

grant execute on function public.create_public_waitlist_entry(
  text, uuid, text, text, text, date, text
) to anon, authenticated;
grant execute on function public.schedule_waitlist_entry(uuid, timestamp without time zone) to authenticated;
grant execute on function public.cancel_waitlist_entry(uuid) to authenticated;
grant execute on function public.reschedule_appointment(uuid, timestamp without time zone) to authenticated;

