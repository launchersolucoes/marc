alter table public.establishments
  add column min_booking_notice_minutes integer not null default 120
    check (min_booking_notice_minutes between 0 and 10080),
  add column max_booking_days integer not null default 60
    check (max_booking_days between 1 and 60),
  add column cancellation_notice_minutes integer not null default 120
    check (cancellation_notice_minutes between 0 and 10080),
  add column booking_confirmation_mode text not null default 'automatic'
    check (booking_confirmation_mode in ('automatic', 'manual'));

create function public.update_booking_rules(
  minimum_notice_minutes integer,
  maximum_booking_days integer,
  cancellation_window_minutes integer,
  confirmation_mode text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  member_role public.establishment_role;
begin
  select membership.establishment_id, membership.role
  into target_establishment_id, member_role
  from public.establishment_memberships membership
  where membership.user_id = (select auth.uid())
    and membership.status = 'active'
  order by membership.created_at
  limit 1;

  if target_establishment_id is null or member_role not in ('owner', 'manager') then
    raise exception 'Insufficient permission';
  end if;

  if minimum_notice_minutes not between 0 and 10080
    or maximum_booking_days not between 1 and 60
    or cancellation_window_minutes not between 0 and 10080
    or confirmation_mode not in ('automatic', 'manual') then
    raise exception 'Invalid booking rules';
  end if;

  update public.establishments
  set
    min_booking_notice_minutes = minimum_notice_minutes,
    max_booking_days = maximum_booking_days,
    cancellation_notice_minutes = cancellation_window_minutes,
    booking_confirmation_mode = confirmation_mode
  where id = target_establishment_id;
end;
$$;

create function public.upsert_own_service_offering(
  service_name text,
  service_description text,
  service_price_cents integer,
  service_duration_minutes integer,
  service_buffer_before_minutes integer,
  service_buffer_after_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_professional public.professionals%rowtype;
  target_service_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if length(trim(service_name)) < 2
    or service_price_cents < 0
    or service_duration_minutes not between 5 and 720
    or service_buffer_before_minutes not between 0 and 180
    or service_buffer_after_minutes not between 0 and 180 then
    raise exception 'Invalid service configuration';
  end if;

  select * into current_professional
  from public.professionals
  where user_id = (select auth.uid()) and is_active
  order by created_at
  limit 1;
  if current_professional.id is null then raise exception 'Professional profile required'; end if;

  select id into target_service_id
  from public.services
  where establishment_id = current_professional.establishment_id
    and lower(name) = lower(trim(service_name))
  limit 1;

  if target_service_id is null then
    insert into public.services (establishment_id, name, description)
    values (current_professional.establishment_id, trim(service_name), nullif(trim(service_description), ''))
    returning id into target_service_id;
  end if;

  insert into public.professional_services (
    professional_id, service_id, price_cents, duration_minutes,
    buffer_before_minutes, buffer_after_minutes, is_active
  ) values (
    current_professional.id, target_service_id, service_price_cents, service_duration_minutes,
    service_buffer_before_minutes, service_buffer_after_minutes, true
  )
  on conflict (professional_id, service_id) do update set
    price_cents = excluded.price_cents,
    duration_minutes = excluded.duration_minutes,
    buffer_before_minutes = excluded.buffer_before_minutes,
    buffer_after_minutes = excluded.buffer_after_minutes,
    is_active = true;

  return target_service_id;
end;
$$;

create or replace function public.get_public_booking_page(establishment_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', establishment.id,
    'name', establishment.name,
    'slug', establishment.slug,
    'category', establishment.category,
    'phone', establishment.phone,
    'address', concat_ws(', ', nullif(establishment.address_line, ''), nullif(establishment.address_number, '')),
    'city', establishment.city,
    'state', establishment.state,
    'min_booking_notice_minutes', establishment.min_booking_notice_minutes,
    'max_booking_days', establishment.max_booking_days,
    'cancellation_notice_minutes', establishment.cancellation_notice_minutes,
    'booking_confirmation_mode', establishment.booking_confirmation_mode,
    'offerings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', offering.id,
        'price_cents', offering.price_cents,
        'duration_minutes', offering.duration_minutes,
        'buffer_before_minutes', offering.buffer_before_minutes,
        'buffer_after_minutes', offering.buffer_after_minutes,
        'professional_id', professional.id,
        'professional_name', professional.display_name,
        'professional_color', professional.color,
        'service_id', service.id,
        'service_name', service.name,
        'service_description', service.description
      ) order by service.name, professional.display_name)
      from public.professional_services offering
      join public.professionals professional on professional.id = offering.professional_id
      join public.services service on service.id = offering.service_id
      where professional.establishment_id = establishment.id
        and professional.is_active and offering.is_active and service.is_active
    ), '[]'::jsonb)
  )
  from public.establishments establishment
  where establishment.slug = establishment_slug and establishment.is_active;
$$;

create function public.enforce_appointment_schedule_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  offering_record record;
  local_buffer_start timestamp without time zone;
  local_buffer_end timestamp without time zone;
  buffered_start timestamptz;
  buffered_end timestamptz;
begin
  if new.status not in ('pending', 'confirmed', 'in_progress') then return new; end if;

  select offering.buffer_before_minutes, offering.buffer_after_minutes, establishment.timezone
  into offering_record
  from public.professional_services offering
  join public.professionals professional on professional.id = offering.professional_id
  join public.establishments establishment on establishment.id = professional.establishment_id
  where offering.id = new.professional_service_id;

  if offering_record.timezone is null then raise exception 'Invalid service'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.professional_id::text, 0));

  buffered_start := new.starts_at - make_interval(mins => offering_record.buffer_before_minutes);
  buffered_end := new.ends_at + make_interval(mins => offering_record.buffer_after_minutes);
  local_buffer_start := buffered_start at time zone offering_record.timezone;
  local_buffer_end := buffered_end at time zone offering_record.timezone;

  if local_buffer_start::date <> local_buffer_end::date
    or not exists (
      select 1 from public.availability_rules availability
      where availability.professional_id = new.professional_id
        and availability.weekday = extract(dow from local_buffer_start)::smallint
        and availability.starts_at <= local_buffer_start::time
        and availability.ends_at >= local_buffer_end::time
        and (availability.valid_from is null or availability.valid_from <= local_buffer_start::date)
        and (availability.valid_until is null or availability.valid_until >= local_buffer_start::date)
    ) then
    raise exception 'Outside availability including preparation time';
  end if;

  if exists (
    select 1 from public.professional_time_off time_off
    where time_off.professional_id = new.professional_id
      and tstzrange(time_off.starts_at, time_off.ends_at, '[)') && tstzrange(buffered_start, buffered_end, '[)')
  ) then raise exception 'Time is blocked including preparation time'; end if;

  if exists (
    select 1
    from public.appointments appointment
    join public.professional_services occupied_offering on occupied_offering.id = appointment.professional_service_id
    where appointment.professional_id = new.professional_id
      and appointment.id <> new.id
      and appointment.status in ('pending', 'confirmed', 'in_progress')
      and tstzrange(
        appointment.starts_at - make_interval(mins => occupied_offering.buffer_before_minutes),
        appointment.ends_at + make_interval(mins => occupied_offering.buffer_after_minutes), '[)'
      ) && tstzrange(buffered_start, buffered_end, '[)')
  ) then raise exception 'Schedule conflict including preparation time'; end if;

  return new;
end;
$$;

create trigger appointments_enforce_schedule_rules
  before insert or update of starts_at, ends_at, status, professional_service_id, professional_id
  on public.appointments
  for each row execute function public.enforce_appointment_schedule_rules();

create or replace function public.get_public_available_slots(
  establishment_slug text,
  target_professional_service_id uuid,
  booking_date date
)
returns table (slot_start text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_professional_id uuid;
  duration_minutes integer;
  before_minutes integer;
  after_minutes integer;
  establishment_timezone text;
  minimum_notice integer;
  maximum_days integer;
  availability_record record;
  slot_local timestamp without time zone;
  slot_start_utc timestamptz;
  slot_end_utc timestamptz;
begin
  select professional.id, offering.duration_minutes, offering.buffer_before_minutes,
    offering.buffer_after_minutes, establishment.timezone,
    establishment.min_booking_notice_minutes, establishment.max_booking_days
  into target_professional_id, duration_minutes, before_minutes, after_minutes,
    establishment_timezone, minimum_notice, maximum_days
  from public.professional_services offering
  join public.professionals professional on professional.id = offering.professional_id
  join public.establishments establishment on establishment.id = professional.establishment_id
  join public.services service on service.id = offering.service_id
  where offering.id = target_professional_service_id
    and establishment.slug = establishment_slug and establishment.is_active
    and professional.is_active and offering.is_active and service.is_active;

  if target_professional_id is null
    or booking_date < (now() at time zone establishment_timezone)::date
    or booking_date > (now() at time zone establishment_timezone)::date + maximum_days then return; end if;

  for availability_record in
    select starts_at, ends_at from public.availability_rules
    where professional_id = target_professional_id
      and weekday = extract(dow from booking_date)::smallint
      and (valid_from is null or valid_from <= booking_date)
      and (valid_until is null or valid_until >= booking_date)
  loop
    for slot_local in select generate_series(
      booking_date + availability_record.starts_at + make_interval(mins => before_minutes),
      booking_date + availability_record.ends_at - make_interval(mins => duration_minutes + after_minutes),
      interval '30 minutes'
    ) loop
      slot_start_utc := slot_local at time zone establishment_timezone;
      slot_end_utc := slot_start_utc + make_interval(mins => duration_minutes);

      if slot_start_utc >= now() + make_interval(mins => minimum_notice)
        and not exists (
          select 1 from public.professional_time_off time_off
          where time_off.professional_id = target_professional_id
            and tstzrange(time_off.starts_at, time_off.ends_at, '[)') && tstzrange(
              slot_start_utc - make_interval(mins => before_minutes),
              slot_end_utc + make_interval(mins => after_minutes), '[)')
        )
        and not exists (
          select 1 from public.appointments appointment
          join public.professional_services occupied on occupied.id = appointment.professional_service_id
          where appointment.professional_id = target_professional_id
            and appointment.status in ('pending', 'confirmed', 'in_progress')
            and tstzrange(
              appointment.starts_at - make_interval(mins => occupied.buffer_before_minutes),
              appointment.ends_at + make_interval(mins => occupied.buffer_after_minutes), '[)'
            ) && tstzrange(
              slot_start_utc - make_interval(mins => before_minutes),
              slot_end_utc + make_interval(mins => after_minutes), '[)')
        ) then
        slot_start := to_char(slot_local, 'YYYY-MM-DD"T"HH24:MI');
        return next;
      end if;
    end loop;
  end loop;
end;
$$;

alter function public.create_public_appointment_unrestricted(
  text, uuid, text, text, text, timestamp without time zone
) rename to create_public_appointment_legacy;

revoke all on function public.create_public_appointment_legacy(
  text, uuid, text, text, text, timestamp without time zone
) from public, anon, authenticated;

create function public.create_public_appointment_unrestricted(
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
  establishment_record public.establishments%rowtype;
  appointment_start timestamptz;
  new_appointment_id uuid;
begin
  select establishment.* into establishment_record
  from public.establishments establishment
  join public.professionals professional on professional.establishment_id = establishment.id
  join public.professional_services offering on offering.professional_id = professional.id
  where establishment.slug = establishment_slug and offering.id = target_professional_service_id
    and establishment.is_active and professional.is_active and offering.is_active;
  if establishment_record.id is null then raise exception 'Invalid service'; end if;

  appointment_start := local_start at time zone establishment_record.timezone;
  if appointment_start < now() + make_interval(mins => establishment_record.min_booking_notice_minutes)
    or local_start::date > (now() at time zone establishment_record.timezone)::date + establishment_record.max_booking_days then
    raise exception 'Booking notice rule';
  end if;

  new_appointment_id := public.create_public_appointment_legacy(
    establishment_slug, target_professional_service_id, customer_name,
    customer_phone, customer_email, local_start
  );

  if establishment_record.booking_confirmation_mode = 'manual' then
    update public.appointments set status = 'pending' where id = new_appointment_id;
  end if;
  return new_appointment_id;
end;
$$;

create or replace function public.create_public_appointment_with_portal(
  establishment_slug text,
  target_professional_service_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  local_start timestamp without time zone
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_appointment_id uuid;
  target_customer_id uuid;
  appointment_status public.appointment_status;
  portal_token text;
begin
  new_appointment_id := public.create_public_appointment(
    establishment_slug, target_professional_service_id, customer_name,
    customer_phone, customer_email, local_start
  );
  select customer_id, status into target_customer_id, appointment_status
  from public.appointments where id = new_appointment_id;
  portal_token := public.issue_customer_portal_token(target_customer_id);
  return jsonb_build_object(
    'appointment_id', new_appointment_id,
    'appointment_status', appointment_status,
    'portal_token', portal_token
  );
end;
$$;

alter function public.get_customer_portal(text) rename to get_customer_portal_legacy;
revoke all on function public.get_customer_portal_legacy(text) from public, anon, authenticated;

create function public.get_customer_portal(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_result jsonb;
  rule_result jsonb;
begin
  base_result := public.get_customer_portal_legacy(raw_token);
  if base_result is null then return null; end if;

  select jsonb_build_object(
    'min_booking_notice_minutes', establishment.min_booking_notice_minutes,
    'max_booking_days', establishment.max_booking_days,
    'cancellation_notice_minutes', establishment.cancellation_notice_minutes,
    'booking_confirmation_mode', establishment.booking_confirmation_mode
  ) into rule_result
  from public.establishments establishment
  where establishment.id = (base_result #>> '{establishment,id}')::uuid;

  return jsonb_set(
    base_result,
    '{establishment}',
    (base_result -> 'establishment') || coalesce(rule_result, '{}'::jsonb)
  );
end;
$$;

alter function public.cancel_customer_portal_appointment(text, uuid, text)
  rename to cancel_customer_portal_appointment_unrestricted;
revoke all on function public.cancel_customer_portal_appointment_unrestricted(text, uuid, text)
  from public, anon, authenticated;

create function public.cancel_customer_portal_appointment(
  raw_token text, target_appointment_id uuid, cancellation_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  appointment_record record;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  select appointment.starts_at, establishment.cancellation_notice_minutes
  into appointment_record
  from public.appointments appointment
  join public.establishments establishment on establishment.id = appointment.establishment_id
  where appointment.id = target_appointment_id and appointment.customer_id = target_customer_id;
  if appointment_record.starts_at is null then raise exception 'Appointment cannot be cancelled'; end if;
  if appointment_record.starts_at < now() + make_interval(mins => appointment_record.cancellation_notice_minutes) then
    raise exception 'Cancellation window closed';
  end if;
  return public.cancel_customer_portal_appointment_unrestricted(raw_token, target_appointment_id, cancellation_note);
end;
$$;

alter function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone)
  rename to reschedule_customer_portal_appointment_unrestricted;
revoke all on function public.reschedule_customer_portal_appointment_unrestricted(text, uuid, timestamp without time zone)
  from public, anon, authenticated;

create function public.reschedule_customer_portal_appointment(
  raw_token text, target_appointment_id uuid, local_start timestamp without time zone
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  appointment_record record;
  requested_start timestamptz;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  select appointment.starts_at, establishment.timezone, establishment.min_booking_notice_minutes,
    establishment.max_booking_days, establishment.cancellation_notice_minutes
  into appointment_record
  from public.appointments appointment
  join public.establishments establishment on establishment.id = appointment.establishment_id
  where appointment.id = target_appointment_id and appointment.customer_id = target_customer_id;
  if appointment_record.starts_at is null then raise exception 'Appointment cannot be rescheduled'; end if;
  if appointment_record.starts_at < now() + make_interval(mins => appointment_record.cancellation_notice_minutes) then
    raise exception 'Cancellation window closed';
  end if;
  requested_start := local_start at time zone appointment_record.timezone;
  if requested_start < now() + make_interval(mins => appointment_record.min_booking_notice_minutes)
    or local_start::date > (now() at time zone appointment_record.timezone)::date + appointment_record.max_booking_days then
    raise exception 'Booking notice rule';
  end if;
  return public.reschedule_customer_portal_appointment_unrestricted(raw_token, target_appointment_id, local_start);
end;
$$;

revoke all on function public.update_booking_rules(integer, integer, integer, text) from public, anon, authenticated;
revoke all on function public.upsert_own_service_offering(text, text, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.enforce_appointment_schedule_rules() from public, anon, authenticated;
revoke all on function public.create_public_appointment_unrestricted(text, uuid, text, text, text, timestamp without time zone) from public, anon, authenticated;
revoke all on function public.get_customer_portal(text) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_appointment(text, uuid, text) from public, anon, authenticated;
revoke all on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) from public, anon, authenticated;

grant execute on function public.update_booking_rules(integer, integer, integer, text) to authenticated;
grant execute on function public.upsert_own_service_offering(text, text, integer, integer, integer, integer) to authenticated;
grant execute on function public.get_public_booking_page(text) to anon, authenticated;
grant execute on function public.get_public_available_slots(text, uuid, date) to anon, authenticated;
grant execute on function public.create_public_appointment_with_portal(text, uuid, text, text, text, timestamp without time zone) to anon, authenticated;
grant execute on function public.get_customer_portal(text) to anon, authenticated;
grant execute on function public.cancel_customer_portal_appointment(text, uuid, text) to anon, authenticated;
grant execute on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) to anon, authenticated;
