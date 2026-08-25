create extension if not exists pgcrypto with schema extensions;

create table public.customer_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index customer_portal_tokens_customer_created_idx
  on public.customer_portal_tokens (customer_id, created_at desc);

alter table public.customer_portal_tokens enable row level security;
revoke all on table public.customer_portal_tokens from public, anon, authenticated;

alter table public.operational_audit_events
  drop constraint if exists operational_audit_events_entity_type_check;

alter table public.operational_audit_events
  add constraint operational_audit_events_entity_type_check
  check (entity_type in ('appointment', 'waitlist', 'availability', 'customer'));

create function public.issue_customer_portal_token(target_customer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
begin
  if not exists (select 1 from public.customers where id = target_customer_id) then
    raise exception 'Customer not found';
  end if;

  update public.customer_portal_tokens
  set revoked_at = now()
  where customer_id = target_customer_id
    and revoked_at is null
    and expires_at > now();

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.customer_portal_tokens (customer_id, token_hash, expires_at)
  values (
    target_customer_id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    now() + interval '90 days'
  );

  return raw_token;
end;
$$;

create function public.resolve_customer_portal_token(raw_token text, touch_access boolean default false)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_record public.customer_portal_tokens%rowtype;
begin
  if length(coalesce(raw_token, '')) <> 64 or raw_token !~ '^[a-f0-9]{64}$' then
    return null;
  end if;

  select * into token_record
  from public.customer_portal_tokens
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and revoked_at is null
    and expires_at > now()
  limit 1;

  if token_record.id is null then
    return null;
  end if;

  if touch_access and (
    token_record.last_used_at is null
    or token_record.last_used_at < now() - interval '15 minutes'
  ) then
    update public.customer_portal_tokens
    set last_used_at = now()
    where id = token_record.id;
  end if;

  return token_record.customer_id;
end;
$$;

create function public.get_customer_portal(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  result jsonb;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token, true);
  if target_customer_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'customer', jsonb_build_object(
      'name', customer.full_name,
      'phone', customer.phone,
      'email', customer.email
    ),
    'establishment', jsonb_build_object(
      'id', establishment.id,
      'name', establishment.name,
      'slug', establishment.slug,
      'phone', establishment.phone,
      'address', concat_ws(', ', nullif(establishment.address_line, ''), nullif(establishment.address_number, '')),
      'city', establishment.city,
      'state', establishment.state,
      'timezone', establishment.timezone,
      'is_active', establishment.is_active
    ),
    'expires_at', portal_token.expires_at,
    'appointments', coalesce((
      select jsonb_agg(item.payload order by item.starts_at desc)
      from (
        select
          appointment.starts_at,
          jsonb_build_object(
            'id', appointment.id,
            'starts_at', appointment.starts_at,
            'ends_at', appointment.ends_at,
            'status', appointment.status,
            'price_cents', appointment.price_cents,
            'professional_service_id', appointment.professional_service_id,
            'service_name', service.name,
            'professional_name', professional.display_name
          ) as payload
        from public.appointments appointment
        join public.professional_services offering on offering.id = appointment.professional_service_id
        join public.services service on service.id = offering.service_id
        join public.professionals professional on professional.id = appointment.professional_id
        where appointment.customer_id = target_customer_id
          and appointment.starts_at >= now() - interval '365 days'
        order by appointment.starts_at desc
        limit 50
      ) item
    ), '[]'::jsonb),
    'waitlist', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', waitlist.id,
          'preferred_date', waitlist.preferred_date,
          'status', waitlist.status,
          'service_name', service.name,
          'professional_name', professional.display_name
        )
        order by waitlist.preferred_date
      )
      from public.waitlist_entries waitlist
      join public.professional_services offering on offering.id = waitlist.professional_service_id
      join public.services service on service.id = offering.service_id
      join public.professionals professional on professional.id = offering.professional_id
      where waitlist.customer_id = target_customer_id
        and waitlist.status = 'waiting'
    ), '[]'::jsonb)
  ) into result
  from public.customers customer
  join public.establishments establishment on establishment.id = customer.establishment_id
  join public.customer_portal_tokens portal_token
    on portal_token.customer_id = customer.id
    and portal_token.token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
  where customer.id = target_customer_id;

  return result;
end;
$$;

create function public.create_public_appointment_with_portal(
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
  portal_token text;
begin
  new_appointment_id := public.create_public_appointment(
    establishment_slug,
    target_professional_service_id,
    customer_name,
    customer_phone,
    customer_email,
    local_start
  );

  select customer_id into target_customer_id
  from public.appointments
  where id = new_appointment_id;

  portal_token := public.issue_customer_portal_token(target_customer_id);
  return jsonb_build_object('appointment_id', new_appointment_id, 'portal_token', portal_token);
end;
$$;

create function public.create_public_waitlist_with_portal(
  establishment_slug text,
  target_professional_service_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  target_preferred_date date,
  waitlist_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_waitlist_id uuid;
  target_customer_id uuid;
  portal_token text;
begin
  new_waitlist_id := public.create_public_waitlist_entry(
    establishment_slug,
    target_professional_service_id,
    customer_name,
    customer_phone,
    customer_email,
    target_preferred_date,
    waitlist_notes
  );

  select customer_id into target_customer_id
  from public.waitlist_entries
  where id = new_waitlist_id;

  portal_token := public.issue_customer_portal_token(target_customer_id);
  return jsonb_build_object('waitlist_id', new_waitlist_id, 'portal_token', portal_token);
end;
$$;

create function public.cancel_customer_portal_appointment(
  raw_token text,
  target_appointment_id uuid,
  cancellation_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  appointment_record public.appointments%rowtype;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  select * into appointment_record
  from public.appointments
  where id = target_appointment_id
    and customer_id = target_customer_id
  for update;

  if appointment_record.id is null
    or appointment_record.status not in ('pending', 'confirmed')
    or appointment_record.starts_at <= now() then
    raise exception 'Appointment cannot be cancelled';
  end if;

  update public.appointments
  set
    status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = coalesce(nullif(left(trim(cancellation_note), 240), ''), 'Cancelado pelo cliente')
  where id = appointment_record.id;

  insert into public.appointment_events (appointment_id, event_type, payload)
  values (
    appointment_record.id,
    'status_changed',
    jsonb_build_object('from', appointment_record.status, 'to', 'cancelled', 'source', 'customer_portal')
  );

  return true;
end;
$$;

create function public.reschedule_customer_portal_appointment(
  raw_token text,
  target_appointment_id uuid,
  local_start timestamp without time zone
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  appointment_record public.appointments%rowtype;
  service_duration integer;
  establishment_timezone text;
  local_end timestamp without time zone;
  appointment_start timestamptz;
  appointment_end timestamptz;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  select * into appointment_record
  from public.appointments
  where id = target_appointment_id
    and customer_id = target_customer_id
  for update;

  if appointment_record.id is null
    or appointment_record.status not in ('pending', 'confirmed')
    or appointment_record.starts_at <= now() then
    raise exception 'Appointment cannot be rescheduled';
  end if;

  select offering.duration_minutes, establishment.timezone
  into service_duration, establishment_timezone
  from public.professional_services offering
  join public.professionals professional on professional.id = offering.professional_id
  join public.establishments establishment on establishment.id = professional.establishment_id
  where offering.id = appointment_record.professional_service_id;

  local_end := local_start + make_interval(mins => service_duration);
  appointment_start := local_start at time zone establishment_timezone;
  appointment_end := local_end at time zone establishment_timezone;

  if appointment_start <= now()
    or local_start::date > (now() at time zone establishment_timezone)::date + 60 then
    raise exception 'Invalid date';
  end if;

  if not exists (
    select 1 from public.availability_rules
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
    select 1 from public.professional_time_off
    where professional_id = appointment_record.professional_id
      and tstzrange(starts_at, ends_at, '[)') && tstzrange(appointment_start, appointment_end, '[)')
  ) then
    raise exception 'Time is blocked';
  end if;

  update public.appointments
  set starts_at = appointment_start, ends_at = appointment_end
  where id = appointment_record.id;

  insert into public.appointment_events (appointment_id, event_type, payload)
  values (
    appointment_record.id,
    'rescheduled',
    jsonb_build_object(
      'from_start', appointment_record.starts_at,
      'to_start', appointment_start,
      'source', 'customer_portal'
    )
  );

  return appointment_start;
exception
  when exclusion_violation then
    raise exception 'Schedule conflict';
end;
$$;

create function public.cancel_customer_portal_waitlist(raw_token text, target_waitlist_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  waitlist_record public.waitlist_entries%rowtype;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  select * into waitlist_record
  from public.waitlist_entries
  where id = target_waitlist_id
    and customer_id = target_customer_id
  for update;

  if waitlist_record.id is null or waitlist_record.status <> 'waiting' then
    raise exception 'Waitlist entry cannot be cancelled';
  end if;

  update public.waitlist_entries
  set status = 'cancelled'
  where id = waitlist_record.id;

  return true;
end;
$$;

create function public.update_customer_portal_profile(
  raw_token text,
  customer_name text,
  customer_phone text,
  customer_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  normalized_phone text;
  normalized_email text;
  updated_customer record;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  normalized_phone := public.normalize_phone(customer_phone);
  normalized_email := nullif(lower(trim(customer_email)), '');
  if length(trim(customer_name)) < 2
    or length(normalized_phone) not between 8 and 15
    or (normalized_email is not null and normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Invalid customer identity';
  end if;

  update public.customers
  set full_name = trim(customer_name), phone = normalized_phone, email = normalized_email
  where id = target_customer_id
  returning full_name, phone, email into updated_customer;

  insert into public.operational_audit_events (
    establishment_id, event_name, entity_type, entity_id, metadata
  )
  select establishment_id, 'customer.profile_updated', 'customer', id, jsonb_build_object('source', 'customer_portal')
  from public.customers
  where id = target_customer_id;

  return jsonb_build_object(
    'name', updated_customer.full_name,
    'phone', updated_customer.phone,
    'email', updated_customer.email
  );
exception
  when unique_violation then
    raise exception 'Phone already exists';
end;
$$;

create function public.create_customer_portal_access(target_customer_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  raw_token text;
begin
  select establishment_id into target_establishment_id
  from public.customers
  where id = target_customer_id;

  if target_establishment_id is null or not public.can_operate_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  raw_token := public.issue_customer_portal_token(target_customer_id);

  insert into public.operational_audit_events (
    establishment_id, actor_user_id, event_name, entity_type, entity_id, metadata
  )
  values (
    target_establishment_id,
    (select auth.uid()),
    'customer.portal_link_rotated',
    'customer',
    target_customer_id,
    '{}'::jsonb
  );

  return raw_token;
end;
$$;

create or replace function public.enforce_operational_write_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
begin
  target_establishment_id := case when tg_op = 'DELETE' then old.establishment_id else new.establishment_id end;

  if not public.establishment_has_product_access(target_establishment_id) then
    if tg_table_name = 'appointments'
      and tg_op = 'UPDATE'
      and new.status = 'cancelled'
      and old.status in ('pending', 'confirmed') then
      return new;
    end if;

    if tg_table_name = 'waitlist_entries'
      and tg_op = 'UPDATE'
      and new.status = 'cancelled'
      and old.status = 'waiting' then
      return new;
    end if;

    raise exception 'Subscription inactive';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.issue_customer_portal_token(uuid) from public, anon, authenticated;
revoke all on function public.resolve_customer_portal_token(text, boolean) from public, anon, authenticated;
revoke all on function public.get_customer_portal(text) from public, anon, authenticated;
revoke all on function public.create_public_appointment_with_portal(text, uuid, text, text, text, timestamp without time zone) from public, anon, authenticated;
revoke all on function public.create_public_waitlist_with_portal(text, uuid, text, text, text, date, text) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_appointment(text, uuid, text) from public, anon, authenticated;
revoke all on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_waitlist(text, uuid) from public, anon, authenticated;
revoke all on function public.update_customer_portal_profile(text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_customer_portal_access(uuid) from public, anon, authenticated;

grant execute on function public.get_customer_portal(text) to anon, authenticated;
grant execute on function public.create_public_appointment_with_portal(text, uuid, text, text, text, timestamp without time zone) to anon, authenticated;
grant execute on function public.create_public_waitlist_with_portal(text, uuid, text, text, text, date, text) to anon, authenticated;
grant execute on function public.cancel_customer_portal_appointment(text, uuid, text) to anon, authenticated;
grant execute on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) to anon, authenticated;
grant execute on function public.cancel_customer_portal_waitlist(text, uuid) to anon, authenticated;
grant execute on function public.update_customer_portal_profile(text, text, text, text) to anon, authenticated;
grant execute on function public.create_customer_portal_access(uuid) to authenticated;
