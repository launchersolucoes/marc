create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create table public.establishment_invitations (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  email text not null,
  role public.establishment_role not null,
  professional_id uuid references public.professionals (id) on delete set null,
  token uuid not null default gen_random_uuid() unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (role <> 'owner')
);

create unique index establishment_invitations_pending_email_unique
  on public.establishment_invitations (establishment_id, lower(email))
  where status = 'pending';

alter table public.establishment_invitations enable row level security;

create policy "Managers can read establishment invitations"
  on public.establishment_invitations for select
  to authenticated
  using (public.can_manage_establishment(establishment_id));

grant select on public.establishment_invitations to authenticated;

create function public.create_team_invitation(
  target_establishment_id uuid,
  invite_email text,
  invite_role public.establishment_role,
  target_professional_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_token uuid;
begin
  if not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if invite_role = 'owner' or length(trim(invite_email)) < 5 then
    raise exception 'Invalid invitation';
  end if;

  if target_professional_id is not null and not exists (
    select 1
    from public.professionals
    where id = target_professional_id
      and establishment_id = target_establishment_id
      and user_id is null
  ) then
    raise exception 'Professional is not available';
  end if;

  update public.establishment_invitations
  set status = 'revoked'
  where establishment_id = target_establishment_id
    and lower(email) = lower(trim(invite_email))
    and status = 'pending';

  insert into public.establishment_invitations (
    establishment_id,
    email,
    role,
    professional_id,
    invited_by
  )
  values (
    target_establishment_id,
    lower(trim(invite_email)),
    invite_role,
    case when invite_role = 'professional' then target_professional_id else null end,
    (select auth.uid())
  )
  returning token into new_token;

  return new_token;
end;
$$;

create function public.get_invitation(invitation_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'email', invitation.email,
    'role', invitation.role,
    'expires_at', invitation.expires_at,
    'status', case
      when invitation.status = 'pending' and invitation.expires_at <= now() then 'expired'
      else invitation.status::text
    end,
    'establishment', jsonb_build_object(
      'name', establishment.name,
      'category', establishment.category
    )
  )
  from public.establishment_invitations invitation
  join public.establishments establishment
    on establishment.id = invitation.establishment_id
  where invitation.token = invitation_token;
$$;

create function public.accept_team_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  invitation_record public.establishment_invitations%rowtype;
  profile_name text;
  linked_professional_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select lower(email) into current_email
  from auth.users
  where id = current_user_id;

  select * into invitation_record
  from public.establishment_invitations
  where token = invitation_token
  for update;

  if invitation_record.id is null
    or invitation_record.status <> 'pending'
    or invitation_record.expires_at <= now() then
    raise exception 'Invitation is not available';
  end if;

  if lower(invitation_record.email) <> current_email then
    raise exception 'Invitation belongs to another email';
  end if;

  insert into public.establishment_memberships (
    establishment_id,
    user_id,
    role,
    status
  )
  values (
    invitation_record.establishment_id,
    current_user_id,
    invitation_record.role,
    'active'
  )
  on conflict (establishment_id, user_id)
  do update set role = excluded.role, status = 'active';

  if invitation_record.role = 'professional' then
    linked_professional_id := invitation_record.professional_id;

    if linked_professional_id is null then
      select full_name into profile_name
      from public.profiles
      where id = current_user_id;

      insert into public.professionals (
        establishment_id,
        user_id,
        display_name,
        contact_email
      )
      values (
        invitation_record.establishment_id,
        current_user_id,
        coalesce(nullif(profile_name, ''), split_part(current_email, '@', 1)),
        current_email
      )
      returning id into linked_professional_id;
    else
      update public.professionals
      set user_id = current_user_id, contact_email = current_email
      where id = linked_professional_id
        and establishment_id = invitation_record.establishment_id
        and user_id is null;
    end if;
  end if;

  update public.establishment_invitations
  set status = 'accepted', accepted_at = now()
  where id = invitation_record.id;

  return invitation_record.establishment_id;
end;
$$;

create function public.get_public_booking_page(establishment_slug text)
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
    'offerings', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', professional_service.id,
          'price_cents', professional_service.price_cents,
          'duration_minutes', professional_service.duration_minutes,
          'professional_id', professional.id,
          'professional_name', professional.display_name,
          'professional_color', professional.color,
          'service_id', service.id,
          'service_name', service.name,
          'service_description', service.description
        )
        order by service.name, professional.display_name
      )
      from public.professional_services professional_service
      join public.professionals professional
        on professional.id = professional_service.professional_id
      join public.services service
        on service.id = professional_service.service_id
      where professional.establishment_id = establishment.id
        and professional.is_active
        and professional_service.is_active
        and service.is_active
    ), '[]'::jsonb)
  )
  from public.establishments establishment
  where establishment.slug = establishment_slug
    and establishment.is_active;
$$;

create function public.get_public_available_slots(
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
  service_duration integer;
  establishment_timezone text;
  availability_record record;
  slot_local timestamp without time zone;
  slot_end_local timestamp without time zone;
  slot_start_utc timestamptz;
  slot_end_utc timestamptz;
begin
  if booking_date < (now() at time zone 'America/Sao_Paulo')::date
    or booking_date > (now() at time zone 'America/Sao_Paulo')::date + 60 then
    return;
  end if;

  select
    professional.id,
    professional_service.duration_minutes,
    establishment.timezone
  into
    target_professional_id,
    service_duration,
    establishment_timezone
  from public.professional_services professional_service
  join public.professionals professional
    on professional.id = professional_service.professional_id
  join public.establishments establishment
    on establishment.id = professional.establishment_id
  where professional_service.id = target_professional_service_id
    and establishment.slug = establishment_slug
    and establishment.is_active
    and professional.is_active
    and professional_service.is_active;

  if target_professional_id is null then
    return;
  end if;

  for availability_record in
    select starts_at, ends_at
    from public.availability_rules
    where professional_id = target_professional_id
      and weekday = extract(dow from booking_date)::smallint
      and (valid_from is null or valid_from <= booking_date)
      and (valid_until is null or valid_until >= booking_date)
  loop
    for slot_local in
      select generate_series(
        booking_date + availability_record.starts_at,
        booking_date + availability_record.ends_at - make_interval(mins => service_duration),
        interval '30 minutes'
      )
    loop
      slot_end_local := slot_local + make_interval(mins => service_duration);
      slot_start_utc := slot_local at time zone establishment_timezone;
      slot_end_utc := slot_end_local at time zone establishment_timezone;

      if slot_start_utc > now()
        and not exists (
          select 1
          from public.professional_time_off time_off
          where time_off.professional_id = target_professional_id
            and tstzrange(time_off.starts_at, time_off.ends_at, '[)') &&
              tstzrange(slot_start_utc, slot_end_utc, '[)')
        )
        and not exists (
          select 1
          from public.appointments appointment
          where appointment.professional_id = target_professional_id
            and appointment.status in ('pending', 'confirmed', 'in_progress')
            and tstzrange(appointment.starts_at, appointment.ends_at, '[)') &&
              tstzrange(slot_start_utc, slot_end_utc, '[)')
        ) then
        slot_start := to_char(slot_local, 'YYYY-MM-DD"T"HH24:MI');
        return next;
      end if;
    end loop;
  end loop;
end;
$$;

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
  target_professional_id uuid;
  service_duration integer;
  service_price integer;
  establishment_timezone text;
  appointment_start timestamptz;
  appointment_end timestamptz;
  local_end timestamp without time zone;
  customer_record_id uuid;
  new_appointment_id uuid;
begin
  if length(trim(customer_name)) < 2 or length(trim(customer_phone)) < 8 then
    raise exception 'Invalid customer';
  end if;

  select
    establishment.id,
    professional.id,
    professional_service.duration_minutes,
    professional_service.price_cents,
    establishment.timezone
  into
    target_establishment_id,
    target_professional_id,
    service_duration,
    service_price,
    establishment_timezone
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

  local_end := local_start + make_interval(mins => service_duration);
  appointment_start := local_start at time zone establishment_timezone;
  appointment_end := local_end at time zone establishment_timezone;

  if appointment_start <= now()
    or local_start::date > (now() at time zone establishment_timezone)::date + 60 then
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

  insert into public.appointments (
    establishment_id,
    professional_id,
    professional_service_id,
    customer_id,
    starts_at,
    ends_at,
    status,
    source,
    price_cents
  )
  values (
    target_establishment_id,
    target_professional_id,
    target_professional_service_id,
    customer_record_id,
    appointment_start,
    appointment_end,
    'confirmed',
    'public_booking',
    service_price
  )
  returning id into new_appointment_id;

  insert into public.appointment_events (
    appointment_id,
    event_type,
    payload
  )
  values (
    new_appointment_id,
    'created',
    jsonb_build_object('source', 'public_booking')
  );

  return new_appointment_id;
exception
  when exclusion_violation then
    raise exception 'Schedule conflict';
end;
$$;

revoke all on function public.create_team_invitation(uuid, text, public.establishment_role, uuid) from public;
revoke all on function public.get_invitation(uuid) from public;
revoke all on function public.accept_team_invitation(uuid) from public;
revoke all on function public.get_public_booking_page(text) from public;
revoke all on function public.get_public_available_slots(text, uuid, date) from public;
revoke all on function public.create_public_appointment(text, uuid, text, text, text, timestamp without time zone) from public;

grant execute on function public.create_team_invitation(
  uuid, text, public.establishment_role, uuid
) to authenticated;
grant execute on function public.get_invitation(uuid) to anon, authenticated;
grant execute on function public.accept_team_invitation(uuid) to authenticated;
grant execute on function public.get_public_booking_page(text) to anon, authenticated;
grant execute on function public.get_public_available_slots(text, uuid, date) to anon, authenticated;
grant execute on function public.create_public_appointment(
  text, uuid, text, text, text, timestamp without time zone
) to anon, authenticated;
