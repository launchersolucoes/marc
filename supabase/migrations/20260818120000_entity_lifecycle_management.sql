alter table public.customers
  add column if not exists is_active boolean not null default true;

create index if not exists customers_establishment_active_updated_idx
  on public.customers (establishment_id, is_active, updated_at desc);

alter policy "Managers and professionals can update professional profiles"
  on public.professionals
  using (public.is_platform_admin() or public.owns_professional(id))
  with check (public.is_platform_admin() or public.owns_professional(id));

alter policy "Professionals manage their service rules"
  on public.professional_services
  using (public.is_platform_admin() or public.owns_professional(professional_id))
  with check (public.is_platform_admin() or public.owns_professional(professional_id));

alter policy "Professionals manage their availability"
  on public.availability_rules
  using (public.is_platform_admin() or public.owns_professional(professional_id))
  with check (public.is_platform_admin() or public.owns_professional(professional_id));

alter policy "Professionals manage their time off"
  on public.professional_time_off
  using (public.is_platform_admin() or public.owns_professional(professional_id))
  with check (public.is_platform_admin() or public.owns_professional(professional_id));

create function public.update_professional_profile(
  target_professional_id uuid,
  professional_name text,
  professional_email text default null,
  professional_phone text default null,
  professional_color text default '#ffa500',
  professional_active boolean default true
)
returns void
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

  if target_establishment_id is null or not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if length(trim(professional_name)) < 2 or length(trim(professional_name)) > 90 then
    raise exception 'Invalid professional name';
  end if;

  if professional_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'Invalid professional color';
  end if;

  if not professional_active and exists (
    select 1 from public.appointments
    where professional_id = target_professional_id
      and starts_at >= now()
      and status in ('pending', 'confirmed', 'in_progress')
  ) then
    raise exception 'Professional has future appointments';
  end if;

  update public.professionals
  set
    display_name = trim(professional_name),
    contact_email = nullif(lower(trim(professional_email)), ''),
    contact_phone = nullif(trim(professional_phone), ''),
    color = professional_color,
    is_active = professional_active
  where id = target_professional_id;
end;
$$;

create function public.revoke_team_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
begin
  select establishment_id into target_establishment_id
  from public.establishment_invitations
  where id = target_invitation_id
    and status = 'pending';

  if target_establishment_id is null or not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  update public.establishment_invitations
  set status = 'revoked'
  where id = target_invitation_id;
end;
$$;

create function public.update_customer_record(
  target_customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text default null,
  customer_notes text default null,
  customer_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  normalized_phone text := public.normalize_phone(customer_phone);
begin
  select establishment_id into target_establishment_id
  from public.customers
  where id = target_customer_id;

  if target_establishment_id is null or not public.can_operate_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if length(trim(customer_name)) < 2
    or length(trim(customer_name)) > 120
    or length(normalized_phone) < 8
    or length(normalized_phone) > 15 then
    raise exception 'Invalid customer';
  end if;

  if exists (
    select 1
    from public.customers
    where establishment_id = target_establishment_id
      and phone = normalized_phone
      and id <> target_customer_id
  ) then
    raise exception 'Customer phone already exists';
  end if;

  if not customer_active and exists (
    select 1 from public.appointments
    where customer_id = target_customer_id
      and starts_at >= now()
      and status in ('pending', 'confirmed', 'in_progress')
  ) then
    raise exception 'Customer has future appointments';
  end if;

  update public.customers
  set
    full_name = trim(customer_name),
    phone = normalized_phone,
    email = nullif(lower(trim(customer_email)), ''),
    notes = nullif(trim(customer_notes), ''),
    is_active = customer_active
  where id = target_customer_id;
end;
$$;

create function public.set_own_service_offering_active(
  target_service_id uuid,
  offering_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_professional_id uuid;
begin
  select id into current_professional_id
  from public.professionals
  where user_id = (select auth.uid())
    and is_active
  order by created_at
  limit 1;

  if current_professional_id is null then
    raise exception 'Professional profile required';
  end if;

  update public.professional_services
  set is_active = offering_active
  where professional_id = current_professional_id
    and service_id = target_service_id;

  if not found then
    raise exception 'Service offering not found';
  end if;
end;
$$;

create function public.reactivate_customer_from_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.customers set is_active = true where id = new.customer_id and not is_active;
  return new;
end;
$$;

drop trigger if exists reactivate_customer_on_appointment on public.appointments;
create trigger reactivate_customer_on_appointment
after insert on public.appointments
for each row execute function public.reactivate_customer_from_activity();

drop trigger if exists reactivate_customer_on_waitlist on public.waitlist_entries;
create trigger reactivate_customer_on_waitlist
after insert on public.waitlist_entries
for each row execute function public.reactivate_customer_from_activity();

revoke all on function public.update_professional_profile(uuid, text, text, text, text, boolean) from public;
revoke all on function public.revoke_team_invitation(uuid) from public;
revoke all on function public.update_customer_record(uuid, text, text, text, text, boolean) from public;
revoke all on function public.set_own_service_offering_active(uuid, boolean) from public;
revoke all on function public.reactivate_customer_from_activity() from public;

grant execute on function public.update_professional_profile(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.revoke_team_invitation(uuid) to authenticated;
grant execute on function public.update_customer_record(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.set_own_service_offering_active(uuid, boolean) to authenticated;
