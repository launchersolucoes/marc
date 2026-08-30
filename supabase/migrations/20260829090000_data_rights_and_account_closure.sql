create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  requester_user_id uuid references auth.users (id) on delete set null,
  request_type text not null check (request_type in ('access', 'correction', 'portability', 'deletion', 'establishment_closure')),
  source text not null check (source in ('authenticated_account', 'customer_portal', 'support')),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'completed', 'rejected')),
  details text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  check (details is null or length(details) <= 600)
);

create index privacy_requests_establishment_status_idx
  on public.privacy_requests (establishment_id, status, requested_at desc);
create index privacy_requests_requester_idx
  on public.privacy_requests (requester_user_id, requested_at desc)
  where requester_user_id is not null;

alter table public.privacy_requests enable row level security;

create policy "Managers and requesters can read privacy requests"
  on public.privacy_requests for select
  to authenticated
  using (
    requester_user_id = (select auth.uid())
    or public.can_manage_establishment(establishment_id)
    or public.is_platform_admin()
  );

revoke all on table public.privacy_requests from public, anon, authenticated;
grant select on table public.privacy_requests to authenticated;

create function public.request_own_data_deletion(request_details text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_establishment_id uuid;
  new_request_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select establishment_id into target_establishment_id
  from public.establishment_memberships
  where user_id = current_user_id and status = 'active'
  order by created_at
  limit 1;

  if target_establishment_id is null then
    raise exception 'Active membership required';
  end if;

  if exists (
    select 1 from public.privacy_requests
    where requester_user_id = current_user_id
      and request_type = 'deletion'
      and status in ('pending', 'in_review')
  ) then
    raise exception 'Deletion request already open';
  end if;

  insert into public.privacy_requests (
    establishment_id, requester_user_id, request_type, source, details
  ) values (
    target_establishment_id,
    current_user_id,
    'deletion',
    'authenticated_account',
    nullif(trim(request_details), '')
  ) returning id into new_request_id;

  return new_request_id;
end;
$$;

create function public.request_customer_portal_deletion(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  target_establishment_id uuid;
  new_request_id uuid;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  perform public.guard_customer_portal_mutation(target_customer_id, 'privacy.deletion_requested');

  select establishment_id into target_establishment_id
  from public.customers where id = target_customer_id;

  select id into new_request_id
  from public.privacy_requests
  where customer_id = target_customer_id
    and request_type = 'deletion'
    and status in ('pending', 'in_review')
  order by requested_at desc
  limit 1;

  if new_request_id is null then
    insert into public.privacy_requests (
      establishment_id, customer_id, request_type, source
    ) values (
      target_establishment_id,
      target_customer_id,
      'deletion',
      'customer_portal'
    ) returning id into new_request_id;
  end if;

  return new_request_id;
end;
$$;

create function public.export_current_establishment_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
begin
  select establishment_id into target_establishment_id
  from public.establishment_memberships
  where user_id = (select auth.uid())
    and role = 'owner'
    and status = 'active'
  order by created_at
  limit 1;

  if target_establishment_id is null then
    raise exception 'Owner access required';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'format_version', 1,
    'establishment', (select to_jsonb(e) - 'created_by' from public.establishments e where e.id = target_establishment_id),
    'team', coalesce((
      select jsonb_agg(jsonb_build_object(
        'membership', to_jsonb(m) - 'user_id',
        'profile', jsonb_build_object('full_name', p.full_name, 'phone', p.phone),
        'professional', case when pr.id is null then null else to_jsonb(pr) - 'user_id' end
      ) order by m.created_at)
      from public.establishment_memberships m
      left join public.profiles p on p.id = m.user_id
      left join public.professionals pr on pr.establishment_id = m.establishment_id and pr.user_id = m.user_id
      where m.establishment_id = target_establishment_id
    ), '[]'::jsonb),
    'invitations', coalesce((select jsonb_agg(to_jsonb(i) - 'token' order by i.created_at) from public.establishment_invitations i where i.establishment_id = target_establishment_id), '[]'::jsonb),
    'professionals', coalesce((select jsonb_agg(to_jsonb(p) - 'user_id' order by p.created_at) from public.professionals p where p.establishment_id = target_establishment_id), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at) from public.services s where s.establishment_id = target_establishment_id), '[]'::jsonb),
    'offerings', coalesce((
      select jsonb_agg(to_jsonb(ps) order by ps.created_at)
      from public.professional_services ps
      join public.professionals p on p.id = ps.professional_id
      where p.establishment_id = target_establishment_id
    ), '[]'::jsonb),
    'availability', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at)
      from public.availability_rules a
      join public.professionals p on p.id = a.professional_id
      where p.establishment_id = target_establishment_id
    ), '[]'::jsonb),
    'time_off', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.starts_at)
      from public.professional_time_off t
      join public.professionals p on p.id = t.professional_id
      where p.establishment_id = target_establishment_id
    ), '[]'::jsonb),
    'customers', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at) from public.customers c where c.establishment_id = target_establishment_id), '[]'::jsonb),
    'appointments', coalesce((select jsonb_agg(to_jsonb(a) order by a.starts_at) from public.appointments a where a.establishment_id = target_establishment_id), '[]'::jsonb),
    'waitlist', coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at) from public.waitlist_entries w where w.establishment_id = target_establishment_id), '[]'::jsonb),
    'financial_entries', coalesce((select jsonb_agg(to_jsonb(f) order by f.occurred_at) from public.financial_entries f where f.establishment_id = target_establishment_id), '[]'::jsonb),
    'financial_closings', coalesce((select jsonb_agg(to_jsonb(f) order by f.business_date) from public.financial_day_closings f where f.establishment_id = target_establishment_id), '[]'::jsonb),
    'subscription', (select to_jsonb(s) - array['provider_customer_id', 'provider_subscription_id'] from public.establishment_subscriptions s where s.establishment_id = target_establishment_id),
    'privacy_requests', coalesce((select jsonb_agg(to_jsonb(r) - 'requester_user_id' order by r.requested_at) from public.privacy_requests r where r.establishment_id = target_establishment_id), '[]'::jsonb)
  );
end;
$$;

create function public.get_customer_portal_export(raw_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
begin
  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'format_version', 1,
    'customer', (
      select jsonb_build_object('id', c.id, 'name', c.full_name, 'phone', c.phone, 'email', c.email, 'created_at', c.created_at, 'updated_at', c.updated_at)
      from public.customers c where c.id = target_customer_id
    ),
    'establishment', (
      select jsonb_build_object('name', e.name, 'slug', e.slug, 'phone', e.phone, 'email', e.email)
      from public.customers c join public.establishments e on e.id = c.establishment_id
      where c.id = target_customer_id
    ),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'starts_at', a.starts_at, 'ends_at', a.ends_at, 'status', a.status,
        'price_cents', a.price_cents, 'service', s.name, 'professional', p.display_name
      ) order by a.starts_at)
      from public.appointments a
      join public.professionals p on p.id = a.professional_id
      join public.professional_services ps on ps.id = a.professional_service_id
      join public.services s on s.id = ps.service_id
      where a.customer_id = target_customer_id
    ), '[]'::jsonb),
    'waitlist', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', w.id, 'preferred_date', w.preferred_date, 'status', w.status,
        'service', s.name, 'professional', p.display_name, 'created_at', w.created_at
      ) order by w.created_at)
      from public.waitlist_entries w
      join public.professional_services ps on ps.id = w.professional_service_id
      join public.professionals p on p.id = ps.professional_id
      join public.services s on s.id = ps.service_id
      where w.customer_id = target_customer_id
    ), '[]'::jsonb)
  );
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
  if current_setting('app.account_closure', true) = 'on' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

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

create function public.close_current_establishment(confirmation_slug text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_establishment public.establishments%rowtype;
begin
  select e.* into target_establishment
  from public.establishments e
  join public.establishment_memberships m on m.establishment_id = e.id
  where m.user_id = current_user_id
    and m.role = 'owner'
    and m.status = 'active'
  order by m.created_at
  limit 1
  for update of e;

  if target_establishment.id is null then
    raise exception 'Owner access required';
  end if;
  if trim(confirmation_slug) <> target_establishment.slug then
    raise exception 'Confirmation does not match';
  end if;
  if exists (
    select 1 from public.establishment_subscriptions
    where establishment_id = target_establishment.id
      and provider_subscription_id is not null
      and status in ('active', 'past_due')
  ) then
    raise exception 'Active billing subscription must be cancelled first';
  end if;

  perform set_config('app.account_closure', 'on', true);

  update public.appointments
  set status = 'cancelled', cancelled_at = now(), cancellation_reason = 'Estabelecimento encerrado', notes = null
  where establishment_id = target_establishment.id
    and starts_at >= now()
    and status in ('pending', 'confirmed', 'in_progress');
  update public.appointments set notes = null where establishment_id = target_establishment.id;

  update public.waitlist_entries
  set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), notes = null
  where establishment_id = target_establishment.id and status = 'waiting';
  update public.waitlist_entries set notes = null where establishment_id = target_establishment.id;

  update public.customer_portal_tokens
  set revoked_at = coalesce(revoked_at, now())
  where customer_id in (select id from public.customers where establishment_id = target_establishment.id);

  update public.customers
  set full_name = 'Cliente ' || left(id::text, 8),
      phone = 'anon-' || replace(id::text, '-', ''),
      email = null,
      notes = null,
      is_active = false
  where establishment_id = target_establishment.id;

  update public.professionals
  set display_name = 'Profissional ' || left(id::text, 8),
      bio = null,
      contact_email = null,
      contact_phone = null,
      is_active = false
  where establishment_id = target_establishment.id;

  update public.services set description = null, is_active = false where establishment_id = target_establishment.id;
  update public.establishment_invitations set status = 'revoked' where establishment_id = target_establishment.id and status = 'pending';

  insert into public.privacy_requests (
    establishment_id, requester_user_id, request_type, source, status, details, completed_at
  ) values (
    target_establishment.id,
    current_user_id,
    'establishment_closure',
    'authenticated_account',
    'completed',
    'Encerramento confirmado pelo proprietário.',
    now()
  );

  update public.establishment_subscriptions
  set status = 'canceled', cancel_at_period_end = false,
      current_period_ends_at = least(coalesce(current_period_ends_at, now()), now()),
      grace_period_ends_at = null
  where establishment_id = target_establishment.id;

  update public.establishment_memberships set status = 'suspended' where establishment_id = target_establishment.id;
  update public.establishments
  set is_active = false, phone = null, email = null, address_line = null, address_number = null,
      address_complement = null, neighborhood = null, city = null, state = null, postal_code = null,
      opening_hours = '{}'::jsonb, logo_path = null
  where id = target_establishment.id;

  return true;
end;
$$;

revoke all on function public.request_own_data_deletion(text) from public, anon, authenticated;
revoke all on function public.request_customer_portal_deletion(text) from public, anon, authenticated;
revoke all on function public.export_current_establishment_data() from public, anon, authenticated;
revoke all on function public.get_customer_portal_export(text) from public, anon, authenticated;
revoke all on function public.close_current_establishment(text) from public, anon, authenticated;

grant execute on function public.request_own_data_deletion(text) to authenticated;
grant execute on function public.request_customer_portal_deletion(text) to anon, authenticated;
grant execute on function public.export_current_establishment_data() to authenticated;
grant execute on function public.get_customer_portal_export(text) to anon, authenticated;
grant execute on function public.close_current_establishment(text) to authenticated;
