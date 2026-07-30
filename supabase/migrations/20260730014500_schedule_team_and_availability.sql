alter table public.professionals
  add column contact_email text,
  add column contact_phone text;

create unique index availability_rules_professional_weekday_unique
  on public.availability_rules (professional_id, weekday)
  where valid_from is null and valid_until is null;

drop policy if exists "Professionals manage their service rules"
  on public.professional_services;
create policy "Professionals manage their service rules"
  on public.professional_services for all
  to authenticated
  using (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  )
  with check (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  );

drop policy if exists "Professionals manage their availability"
  on public.availability_rules;
create policy "Professionals manage their availability"
  on public.availability_rules for all
  to authenticated
  using (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  )
  with check (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  );

drop policy if exists "Professionals manage their time off"
  on public.professional_time_off;
create policy "Professionals manage their time off"
  on public.professional_time_off for all
  to authenticated
  using (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  )
  with check (
    public.is_platform_admin()
    or public.owns_professional(professional_id)
  );

create function public.create_professional_profile(
  target_establishment_id uuid,
  professional_name text,
  professional_email text default null,
  professional_phone text default null,
  professional_color text default '#ffa500'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_professional_id uuid;
begin
  if not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if length(trim(professional_name)) < 2 then
    raise exception 'Invalid professional name';
  end if;

  insert into public.professionals (
    establishment_id,
    display_name,
    contact_email,
    contact_phone,
    color
  )
  values (
    target_establishment_id,
    trim(professional_name),
    nullif(lower(trim(professional_email)), ''),
    nullif(trim(professional_phone), ''),
    professional_color
  )
  returning id into new_professional_id;

  return new_professional_id;
end;
$$;

create function public.configure_weekly_availability(
  target_professional_id uuid,
  schedule jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  schedule_item jsonb;
  schedule_weekday smallint;
  schedule_start time;
  schedule_end time;
begin
  if not (
    public.is_platform_admin()
    or public.owns_professional(target_professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  if jsonb_typeof(schedule) <> 'array' then
    raise exception 'Invalid schedule';
  end if;

  delete from public.availability_rules
  where professional_id = target_professional_id
    and valid_from is null
    and valid_until is null;

  for schedule_item in select * from jsonb_array_elements(schedule)
  loop
    schedule_weekday := (schedule_item ->> 'weekday')::smallint;
    schedule_start := (schedule_item ->> 'starts_at')::time;
    schedule_end := (schedule_item ->> 'ends_at')::time;

    if schedule_weekday not between 0 and 6 or schedule_start >= schedule_end then
      raise exception 'Invalid schedule item';
    end if;

    insert into public.availability_rules (
      professional_id,
      weekday,
      starts_at,
      ends_at
    )
    values (
      target_professional_id,
      schedule_weekday,
      schedule_start,
      schedule_end
    );
  end loop;
end;
$$;

create function public.create_professional_time_off(
  target_professional_id uuid,
  local_start timestamp without time zone,
  local_end timestamp without time zone,
  time_off_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  establishment_timezone text;
  new_time_off_id uuid;
begin
  if not (
    public.is_platform_admin()
    or public.owns_professional(target_professional_id)
  ) then
    raise exception 'Insufficient permission';
  end if;

  select establishments.timezone into establishment_timezone
  from public.professionals
  join public.establishments on establishments.id = professionals.establishment_id
  where professionals.id = target_professional_id;

  if local_start >= local_end then
    raise exception 'Invalid time off interval';
  end if;

  insert into public.professional_time_off (
    professional_id,
    starts_at,
    ends_at,
    reason
  )
  values (
    target_professional_id,
    local_start at time zone establishment_timezone,
    local_end at time zone establishment_timezone,
    nullif(trim(time_off_reason), '')
  )
  returning id into new_time_off_id;

  return new_time_off_id;
end;
$$;

create function public.create_staff_appointment(
  target_establishment_id uuid,
  target_professional_service_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  local_start timestamp without time zone,
  appointment_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_professional_id uuid;
  service_duration integer;
  service_price integer;
  establishment_timezone text;
  appointment_start timestamptz;
  appointment_end timestamptz;
  customer_record_id uuid;
  new_appointment_id uuid;
  member_role public.establishment_role;
  local_weekday smallint;
  local_start_time time;
  local_end_time time;
begin
  member_role := public.establishment_role_for(target_establishment_id);
  if current_user_id is null or member_role is null then
    raise exception 'Authentication required';
  end if;

  select
    professional_services.professional_id,
    professional_services.duration_minutes,
    professional_services.price_cents,
    establishments.timezone
  into
    target_professional_id,
    service_duration,
    service_price,
    establishment_timezone
  from public.professional_services
  join public.professionals
    on professionals.id = professional_services.professional_id
  join public.establishments
    on establishments.id = professionals.establishment_id
  where professional_services.id = target_professional_service_id
    and professionals.establishment_id = target_establishment_id
    and professionals.is_active
    and professional_services.is_active;

  if target_professional_id is null then
    raise exception 'Invalid service';
  end if;

  if member_role = 'professional'
    and not public.owns_professional(target_professional_id) then
    raise exception 'Professionals can only use their own agenda';
  end if;

  appointment_start := local_start at time zone establishment_timezone;
  appointment_end := appointment_start + make_interval(mins => service_duration);
  local_weekday := extract(dow from local_start)::smallint;
  local_start_time := local_start::time;
  local_end_time := (local_start + make_interval(mins => service_duration))::time;

  if not exists (
    select 1
    from public.availability_rules
    where professional_id = target_professional_id
      and weekday = local_weekday
      and starts_at <= local_start_time
      and ends_at >= local_end_time
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
    price_cents,
    notes,
    created_by
  )
  values (
    target_establishment_id,
    target_professional_id,
    target_professional_service_id,
    customer_record_id,
    appointment_start,
    appointment_end,
    'confirmed',
    'staff',
    service_price,
    nullif(trim(appointment_notes), ''),
    current_user_id
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
    current_user_id,
    'created',
    jsonb_build_object('source', 'staff')
  );

  return new_appointment_id;
exception
  when exclusion_violation then
    raise exception 'Schedule conflict';
end;
$$;

grant execute on function public.create_professional_profile(
  uuid, text, text, text, text
) to authenticated;
grant execute on function public.configure_weekly_availability(
  uuid, jsonb
) to authenticated;
grant execute on function public.create_professional_time_off(
  uuid, timestamp without time zone, timestamp without time zone, text
) to authenticated;
grant execute on function public.create_staff_appointment(
  uuid, uuid, text, text, text, timestamp without time zone, text
) to authenticated;
