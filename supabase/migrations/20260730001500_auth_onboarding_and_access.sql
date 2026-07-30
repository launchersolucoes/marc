alter table public.establishments
  add column category text not null default 'other'
  check (category in ('barbershop', 'salon', 'nail_studio', 'beauty_studio', 'other'));

alter table public.professionals
  drop constraint if exists professionals_establishment_id_user_id_key;

create unique index professionals_establishment_user_unique
  on public.professionals (establishment_id, user_id)
  where user_id is not null;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = (select auth.uid())
  );
$$;

create function public.establishment_role_for(target_establishment_id uuid)
returns public.establishment_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.establishment_memberships
  where establishment_id = target_establishment_id
    and user_id = (select auth.uid())
    and status = 'active'
  limit 1;
$$;

create function public.has_establishment_access(target_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.establishment_memberships
    where establishment_id = target_establishment_id
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create function public.can_operate_establishment(target_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or public.establishment_role_for(target_establishment_id)
      in ('owner', 'manager', 'receptionist');
$$;

create function public.can_manage_establishment(target_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or public.establishment_role_for(target_establishment_id) in ('owner', 'manager');
$$;

create function public.owns_professional(target_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.professionals
    where id = target_professional_id
      and user_id = (select auth.uid())
  );
$$;

create function public.onboard_establishment(
  establishment_name text,
  establishment_slug text,
  establishment_phone text,
  establishment_email text,
  establishment_category text,
  establishment_address text default null,
  establishment_city text default null,
  establishment_state text default null,
  owner_works_here boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_establishment_id uuid;
  owner_name text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(establishment_name)) < 2 then
    raise exception 'Invalid establishment name';
  end if;

  if establishment_category not in (
    'barbershop', 'salon', 'nail_studio', 'beauty_studio', 'other'
  ) then
    raise exception 'Invalid establishment category';
  end if;

  insert into public.establishments (
    name,
    slug,
    phone,
    email,
    category,
    address_line,
    city,
    state,
    created_by
  )
  values (
    trim(establishment_name),
    trim(establishment_slug),
    nullif(trim(establishment_phone), ''),
    nullif(trim(establishment_email), ''),
    establishment_category,
    nullif(trim(establishment_address), ''),
    nullif(trim(establishment_city), ''),
    nullif(upper(trim(establishment_state)), ''),
    current_user_id
  )
  returning id into new_establishment_id;

  insert into public.establishment_memberships (
    establishment_id,
    user_id,
    role,
    status
  )
  values (new_establishment_id, current_user_id, 'owner', 'active');

  if owner_works_here then
    select full_name into owner_name
    from public.profiles
    where id = current_user_id;

    insert into public.professionals (
      establishment_id,
      user_id,
      display_name
    )
    values (
      new_establishment_id,
      current_user_id,
      coalesce(nullif(owner_name, ''), split_part(establishment_email, '@', 1), 'Profissional')
    );
  end if;

  return new_establishment_id;
end;
$$;

create policy "Platform admins can read platform admins"
  on public.platform_admins for select
  to authenticated
  using (public.is_platform_admin());

create policy "Members can read their establishments"
  on public.establishments for select
  to authenticated
  using (public.has_establishment_access(id));

create policy "Owners and managers can update establishments"
  on public.establishments for update
  to authenticated
  using (public.can_manage_establishment(id))
  with check (public.can_manage_establishment(id));

create policy "Members can read memberships"
  on public.establishment_memberships for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.has_establishment_access(establishment_id)
  );

create policy "Owners and managers can manage memberships"
  on public.establishment_memberships for all
  to authenticated
  using (public.can_manage_establishment(establishment_id))
  with check (public.can_manage_establishment(establishment_id));

create policy "Members can read professionals"
  on public.professionals for select
  to authenticated
  using (public.has_establishment_access(establishment_id));

create policy "Managers and professionals can update professional profiles"
  on public.professionals for update
  to authenticated
  using (
    public.can_manage_establishment(establishment_id)
    or user_id = (select auth.uid())
  )
  with check (
    public.can_manage_establishment(establishment_id)
    or user_id = (select auth.uid())
  );

create policy "Managers can create professionals"
  on public.professionals for insert
  to authenticated
  with check (public.can_manage_establishment(establishment_id));

create policy "Members can read services"
  on public.services for select
  to authenticated
  using (public.has_establishment_access(establishment_id));

create policy "Members can create services"
  on public.services for insert
  to authenticated
  with check (public.has_establishment_access(establishment_id));

create policy "Managers can update services"
  on public.services for update
  to authenticated
  using (public.can_manage_establishment(establishment_id))
  with check (public.can_manage_establishment(establishment_id));

create policy "Members can read professional services"
  on public.professional_services for select
  to authenticated
  using (
    exists (
      select 1 from public.professionals
      where professionals.id = professional_services.professional_id
        and public.has_establishment_access(professionals.establishment_id)
    )
  );

create policy "Professionals manage their service rules"
  on public.professional_services for all
  to authenticated
  using (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = professional_services.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  )
  with check (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = professional_services.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  );

create policy "Members can read availability"
  on public.availability_rules for select
  to authenticated
  using (
    exists (
      select 1 from public.professionals
      where professionals.id = availability_rules.professional_id
        and public.has_establishment_access(professionals.establishment_id)
    )
  );

create policy "Professionals manage their availability"
  on public.availability_rules for all
  to authenticated
  using (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = availability_rules.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  )
  with check (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = availability_rules.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  );

create policy "Members can read time off"
  on public.professional_time_off for select
  to authenticated
  using (
    exists (
      select 1 from public.professionals
      where professionals.id = professional_time_off.professional_id
        and public.has_establishment_access(professionals.establishment_id)
    )
  );

create policy "Professionals manage their time off"
  on public.professional_time_off for all
  to authenticated
  using (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = professional_time_off.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  )
  with check (
    public.owns_professional(professional_id)
    or exists (
      select 1 from public.professionals
      where professionals.id = professional_time_off.professional_id
        and public.can_manage_establishment(professionals.establishment_id)
    )
  );

create policy "Operators and professionals can read customers"
  on public.customers for select
  to authenticated
  using (
    public.can_operate_establishment(establishment_id)
    or exists (
      select 1
      from public.appointments
      join public.professionals on professionals.id = appointments.professional_id
      where appointments.customer_id = customers.id
        and professionals.user_id = (select auth.uid())
    )
  );

create policy "Operators can manage customers"
  on public.customers for all
  to authenticated
  using (public.can_operate_establishment(establishment_id))
  with check (public.can_operate_establishment(establishment_id));

create policy "Users see the appointments in their scope"
  on public.appointments for select
  to authenticated
  using (
    public.can_operate_establishment(establishment_id)
    or public.owns_professional(professional_id)
  );

create policy "Users manage the appointments in their scope"
  on public.appointments for all
  to authenticated
  using (
    public.can_operate_establishment(establishment_id)
    or public.owns_professional(professional_id)
  )
  with check (
    public.can_operate_establishment(establishment_id)
    or public.owns_professional(professional_id)
  );

create policy "Users can read appointment events in their scope"
  on public.appointment_events for select
  to authenticated
  using (
    exists (
      select 1 from public.appointments
      where appointments.id = appointment_events.appointment_id
        and (
          public.can_operate_establishment(appointments.establishment_id)
          or public.owns_professional(appointments.professional_id)
        )
    )
  );

grant select, update on public.establishments to authenticated;
grant select, insert, update, delete on public.establishment_memberships to authenticated;
grant select, insert, update on public.professionals to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.professional_services to authenticated;
grant select, insert, update, delete on public.availability_rules to authenticated;
grant select, insert, update, delete on public.professional_time_off to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select on public.appointment_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.onboard_establishment(
  text, text, text, text, text, text, text, text, boolean
) to authenticated;

