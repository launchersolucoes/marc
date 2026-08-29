create table public.customer_portal_mutation_events (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  action_name text not null check (action_name in ('appointment_cancel', 'appointment_reschedule', 'waitlist_cancel', 'profile_update')),
  created_at timestamptz not null default now()
);

create index customer_portal_mutation_events_customer_created_idx
  on public.customer_portal_mutation_events (customer_id, created_at desc);

alter table public.customer_portal_mutation_events enable row level security;
revoke all on table public.customer_portal_mutation_events from public, anon, authenticated;

create function public.guard_customer_portal_mutation(raw_token text, requested_action text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_customer_id uuid;
  recent_count integer;
  daily_count integer;
begin
  if requested_action not in ('appointment_cancel', 'appointment_reschedule', 'waitlist_cancel', 'profile_update') then
    raise exception 'Invalid portal action';
  end if;

  target_customer_id := public.resolve_customer_portal_token(raw_token);
  if target_customer_id is null then
    raise exception 'Invalid portal access';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_customer_id::text, 0));

  delete from public.customer_portal_mutation_events
  where customer_id = target_customer_id
    and created_at < now() - interval '7 days';

  select
    count(*) filter (where created_at >= now() - interval '10 minutes'),
    count(*) filter (where created_at >= now() - interval '24 hours')
  into recent_count, daily_count
  from public.customer_portal_mutation_events
  where customer_id = target_customer_id
    and created_at >= now() - interval '24 hours';

  if recent_count >= 12 or daily_count >= 40 then
    raise exception 'Portal rate limit exceeded';
  end if;

  insert into public.customer_portal_mutation_events (customer_id, action_name)
  values (target_customer_id, requested_action);

  return target_customer_id;
end;
$$;

alter function public.cancel_customer_portal_appointment(text, uuid, text)
  rename to cancel_customer_portal_appointment_rate_unrestricted;

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
begin
  perform public.guard_customer_portal_mutation(raw_token, 'appointment_cancel');
  return public.cancel_customer_portal_appointment_rate_unrestricted(raw_token, target_appointment_id, cancellation_note);
end;
$$;

alter function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone)
  rename to reschedule_customer_portal_appointment_rate_unrestricted;

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
begin
  perform public.guard_customer_portal_mutation(raw_token, 'appointment_reschedule');
  return public.reschedule_customer_portal_appointment_rate_unrestricted(raw_token, target_appointment_id, local_start);
end;
$$;

alter function public.cancel_customer_portal_waitlist(text, uuid)
  rename to cancel_customer_portal_waitlist_rate_unrestricted;

create function public.cancel_customer_portal_waitlist(raw_token text, target_waitlist_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.guard_customer_portal_mutation(raw_token, 'waitlist_cancel');
  return public.cancel_customer_portal_waitlist_rate_unrestricted(raw_token, target_waitlist_id);
end;
$$;

alter function public.update_customer_portal_profile(text, text, text, text)
  rename to update_customer_portal_profile_rate_unrestricted;

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
begin
  perform public.guard_customer_portal_mutation(raw_token, 'profile_update');
  return public.update_customer_portal_profile_rate_unrestricted(raw_token, customer_name, customer_phone, customer_email);
end;
$$;

create function public.get_customer_portal_access_status(target_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  access_result jsonb;
begin
  select customer.establishment_id into target_establishment_id
  from public.customers customer
  where customer.id = target_customer_id;

  if target_establishment_id is null or not exists (
    select 1
    from public.establishment_memberships membership
    where membership.establishment_id = target_establishment_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'receptionist')
  ) then
    raise exception 'Insufficient permission';
  end if;

  select jsonb_build_object(
    'active', true,
    'expires_at', token.expires_at,
    'last_used_at', token.last_used_at
  ) into access_result
  from public.customer_portal_tokens token
  where token.customer_id = target_customer_id
    and token.revoked_at is null
    and token.expires_at > now()
  order by token.created_at desc
  limit 1;

  return coalesce(access_result, jsonb_build_object('active', false));
end;
$$;

create function public.revoke_customer_portal_access(target_customer_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
  revoked_count integer;
begin
  select customer.establishment_id into target_establishment_id
  from public.customers customer
  where customer.id = target_customer_id;

  if target_establishment_id is null or not exists (
    select 1
    from public.establishment_memberships membership
    where membership.establishment_id = target_establishment_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role in ('owner', 'manager', 'receptionist')
  ) then
    raise exception 'Insufficient permission';
  end if;

  update public.customer_portal_tokens
  set revoked_at = now()
  where customer_id = target_customer_id
    and revoked_at is null
    and expires_at > now();
  get diagnostics revoked_count = row_count;

  if revoked_count > 0 then
    insert into public.operational_audit_events (
      establishment_id, actor_user_id, event_name, entity_type, entity_id, metadata
    ) values (
      target_establishment_id,
      (select auth.uid()),
      'customer.portal_access_revoked',
      'customer',
      target_customer_id,
      '{}'::jsonb
    );
  end if;

  return revoked_count > 0;
end;
$$;

revoke all on function public.guard_customer_portal_mutation(text, text) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_appointment_rate_unrestricted(text, uuid, text) from public, anon, authenticated;
revoke all on function public.reschedule_customer_portal_appointment_rate_unrestricted(text, uuid, timestamp without time zone) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_waitlist_rate_unrestricted(text, uuid) from public, anon, authenticated;
revoke all on function public.update_customer_portal_profile_rate_unrestricted(text, text, text, text) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_appointment(text, uuid, text) from public, anon, authenticated;
revoke all on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) from public, anon, authenticated;
revoke all on function public.cancel_customer_portal_waitlist(text, uuid) from public, anon, authenticated;
revoke all on function public.update_customer_portal_profile(text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_customer_portal_access_status(uuid) from public, anon, authenticated;
revoke all on function public.revoke_customer_portal_access(uuid) from public, anon, authenticated;

grant execute on function public.cancel_customer_portal_appointment(text, uuid, text) to anon, authenticated;
grant execute on function public.reschedule_customer_portal_appointment(text, uuid, timestamp without time zone) to anon, authenticated;
grant execute on function public.cancel_customer_portal_waitlist(text, uuid) to anon, authenticated;
grant execute on function public.update_customer_portal_profile(text, text, text, text) to anon, authenticated;
grant execute on function public.get_customer_portal_access_status(uuid) to authenticated;
grant execute on function public.revoke_customer_portal_access(uuid) to authenticated;
