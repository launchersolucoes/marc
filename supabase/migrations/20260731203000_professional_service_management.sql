create unique index if not exists services_establishment_name_ci_unique
  on public.services (establishment_id, lower(name));

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'Members can create services'
  ) then
    alter policy "Members can create services"
      on public.services
      to authenticated
      with check (
        public.is_platform_admin()
        or exists (
          select 1
          from public.professionals professional
          where professional.establishment_id = services.establishment_id
            and professional.user_id = (select auth.uid())
            and professional.is_active
        )
      );

    alter policy "Members can create services"
      on public.services
      rename to "Professionals can create catalog services";
  elsif not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'services'
      and policyname = 'Professionals can create catalog services'
  ) then
    create policy "Professionals can create catalog services"
      on public.services for insert
      to authenticated
      with check (
        public.is_platform_admin()
        or exists (
          select 1
          from public.professionals professional
          where professional.establishment_id = services.establishment_id
            and professional.user_id = (select auth.uid())
            and professional.is_active
        )
      );
  end if;
end;
$$;

create function public.upsert_own_service_offering(
  service_name text,
  service_description text,
  service_price_cents integer,
  service_duration_minutes integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_professional public.professionals%rowtype;
  target_service_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(service_name)) < 2
    or service_price_cents < 0
    or service_duration_minutes < 5
    or service_duration_minutes > 720 then
    raise exception 'Invalid service configuration';
  end if;

  select * into current_professional
  from public.professionals
  where user_id = current_user_id
    and is_active
  order by created_at
  limit 1;

  if current_professional.id is null then
    raise exception 'Professional profile required';
  end if;

  select id into target_service_id
  from public.services
  where establishment_id = current_professional.establishment_id
    and lower(name) = lower(trim(service_name))
  limit 1;

  if target_service_id is null then
    insert into public.services (establishment_id, name, description)
    values (
      current_professional.establishment_id,
      trim(service_name),
      nullif(trim(service_description), '')
    )
    returning id into target_service_id;
  end if;

  insert into public.professional_services (
    professional_id,
    service_id,
    price_cents,
    duration_minutes,
    is_active
  )
  values (
    current_professional.id,
    target_service_id,
    service_price_cents,
    service_duration_minutes,
    true
  )
  on conflict (professional_id, service_id)
  do update set
    price_cents = excluded.price_cents,
    duration_minutes = excluded.duration_minutes,
    is_active = true;

  return target_service_id;
end;
$$;

revoke all on function public.upsert_own_service_offering(text, text, integer, integer) from public;
grant execute on function public.upsert_own_service_offering(text, text, integer, integer) to authenticated;
