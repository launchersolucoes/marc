create table public.operational_audit_events (
  id bigint generated always as identity primary key,
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_name ~ '^[a-z_]+\.[a-z_]+$'),
  check (entity_type in ('appointment', 'waitlist', 'availability'))
);

create index operational_audit_events_establishment_created_idx
  on public.operational_audit_events (establishment_id, created_at desc);

alter table public.operational_audit_events enable row level security;

create policy "Managers can read operational audit events"
  on public.operational_audit_events for select
  to authenticated
  using (
    public.is_platform_admin()
    or public.can_manage_establishment(establishment_id)
  );

revoke all on table public.operational_audit_events from public, anon, authenticated;
grant select on table public.operational_audit_events to authenticated;

create function public.capture_operational_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  audit_event_name text;
  audit_entity_type text;
  audit_establishment_id uuid;
  audit_entity_id uuid;
  audit_metadata jsonb := '{}'::jsonb;
begin
  if tg_table_name = 'appointments' then
    audit_entity_type := 'appointment';
    audit_establishment_id := new.establishment_id;
    audit_entity_id := new.id;

    if tg_op = 'INSERT' then
      audit_event_name := 'appointment.created';
      audit_metadata := jsonb_build_object('source', new.source, 'status', new.status);
    elsif new.status is distinct from old.status then
      audit_event_name := 'appointment.status_changed';
      audit_metadata := jsonb_build_object('from', old.status, 'to', new.status);
    elsif new.starts_at is distinct from old.starts_at then
      audit_event_name := 'appointment.rescheduled';
    end if;
  elsif tg_table_name = 'waitlist_entries' then
    audit_entity_type := 'waitlist';
    audit_establishment_id := new.establishment_id;
    audit_entity_id := new.id;

    if tg_op = 'INSERT' then
      audit_event_name := 'waitlist.created';
    elsif new.status is distinct from old.status then
      audit_event_name := 'waitlist.status_changed';
      audit_metadata := jsonb_build_object('from', old.status, 'to', new.status);
    end if;
  elsif tg_table_name = 'professional_time_off' and tg_op = 'INSERT' then
    audit_entity_type := 'availability';
    audit_establishment_id := (
      select professional.establishment_id
      from public.professionals professional
      where professional.id = new.professional_id
    );
    audit_entity_id := new.id;
    audit_event_name := 'availability.blocked';
  end if;

  if audit_event_name is not null and audit_establishment_id is not null then
    insert into public.operational_audit_events (
      establishment_id,
      actor_user_id,
      event_name,
      entity_type,
      entity_id,
      metadata
    )
    values (
      audit_establishment_id,
      (select auth.uid()),
      audit_event_name,
      audit_entity_type,
      audit_entity_id,
      audit_metadata
    );
  end if;

  return new;
end;
$$;

revoke all on function public.capture_operational_audit_event() from public, anon, authenticated;

create trigger appointments_capture_operational_audit
  after insert or update of status, starts_at on public.appointments
  for each row execute function public.capture_operational_audit_event();

create trigger waitlist_capture_operational_audit
  after insert or update of status on public.waitlist_entries
  for each row execute function public.capture_operational_audit_event();

create trigger time_off_capture_operational_audit
  after insert on public.professional_time_off
  for each row execute function public.capture_operational_audit_event();

alter function public.create_public_appointment(
  text, uuid, text, text, text, timestamp without time zone
) rename to create_public_appointment_unrestricted;

revoke all on function public.create_public_appointment_unrestricted(
  text, uuid, text, text, text, timestamp without time zone
) from public, anon, authenticated;

create function public.create_public_appointment(
  establishment_slug text,
  target_professional_service_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  local_start timestamp without time zone
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  customer_record_id uuid;
  recent_booking_count integer;
  future_booking_count integer;
begin
  select establishment.id into target_establishment_id
  from public.establishments establishment
  where establishment.slug = establishment_slug
    and establishment.is_active;

  select customer.id into customer_record_id
  from public.customers customer
  where customer.establishment_id = target_establishment_id
    and customer.phone = regexp_replace(customer_phone, '\D', '', 'g')
  limit 1;

  if customer_record_id is not null then
    select
      count(*) filter (where appointment.created_at >= now() - interval '15 minutes'),
      count(*) filter (
        where appointment.starts_at > now()
          and appointment.status in ('pending', 'confirmed', 'in_progress')
      )
    into recent_booking_count, future_booking_count
    from public.appointments appointment
    where appointment.establishment_id = target_establishment_id
      and appointment.customer_id = customer_record_id;

    if recent_booking_count >= 5 or future_booking_count >= 10 then
      raise exception 'Public booking limit reached';
    end if;
  end if;

  return public.create_public_appointment_unrestricted(
    establishment_slug,
    target_professional_service_id,
    customer_name,
    regexp_replace(customer_phone, '\D', '', 'g'),
    customer_email,
    local_start
  );
end;
$$;

revoke all on function public.create_public_appointment(
  text, uuid, text, text, text, timestamp without time zone
) from public;
grant execute on function public.create_public_appointment(
  text, uuid, text, text, text, timestamp without time zone
) to anon, authenticated;

alter function public.create_public_waitlist_entry(
  text, uuid, text, text, text, date, text
) rename to create_public_waitlist_entry_unrestricted;

revoke all on function public.create_public_waitlist_entry_unrestricted(
  text, uuid, text, text, text, date, text
) from public, anon, authenticated;

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
  waiting_count integer;
  existing_request_id uuid;
begin
  select establishment.id into target_establishment_id
  from public.establishments establishment
  where establishment.slug = establishment_slug
    and establishment.is_active;

  select customer.id into customer_record_id
  from public.customers customer
  where customer.establishment_id = target_establishment_id
    and customer.phone = regexp_replace(customer_phone, '\D', '', 'g')
  limit 1;

  if customer_record_id is not null then
    select waitlist.id into existing_request_id
    from public.waitlist_entries waitlist
    where waitlist.establishment_id = target_establishment_id
      and waitlist.professional_service_id = target_professional_service_id
      and waitlist.customer_id = customer_record_id
      and waitlist.preferred_date = target_preferred_date
      and waitlist.status = 'waiting'
    limit 1;

    if existing_request_id is not null then
      return existing_request_id;
    end if;

    select count(*) into waiting_count
    from public.waitlist_entries waitlist
    where waitlist.establishment_id = target_establishment_id
      and waitlist.customer_id = customer_record_id
      and waitlist.status = 'waiting';

    if waiting_count >= 5 then
      raise exception 'Public waitlist limit reached';
    end if;
  end if;

  return public.create_public_waitlist_entry_unrestricted(
    establishment_slug,
    target_professional_service_id,
    customer_name,
    regexp_replace(customer_phone, '\D', '', 'g'),
    customer_email,
    target_preferred_date,
    waitlist_notes
  );
end;
$$;

revoke all on function public.create_public_waitlist_entry(
  text, uuid, text, text, text, date, text
) from public;
grant execute on function public.create_public_waitlist_entry(
  text, uuid, text, text, text, date, text
) to anon, authenticated;
