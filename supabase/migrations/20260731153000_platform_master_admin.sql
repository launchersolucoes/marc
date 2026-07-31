insert into public.platform_admins (user_id)
select id
from auth.users
where lower(email) = 'launchersolucoes@gmail.com'
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
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

  if lower(new.email) = 'launchersolucoes@gmail.com' then
    insert into public.platform_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create function public.get_platform_admin_overview()
returns table (
  establishment_id uuid,
  establishment_name text,
  slug text,
  category text,
  is_active boolean,
  created_at timestamptz,
  members_count bigint,
  professionals_count bigint,
  appointments_count bigint,
  plan_code public.subscription_plan,
  subscription_status public.subscription_status,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  grace_period_ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  return query
  select
    establishment.id,
    establishment.name,
    establishment.slug,
    establishment.category,
    establishment.is_active,
    establishment.created_at,
    (select count(*) from public.establishment_memberships membership where membership.establishment_id = establishment.id),
    (select count(*) from public.professionals professional where professional.establishment_id = establishment.id),
    (select count(*) from public.appointments appointment where appointment.establishment_id = establishment.id),
    subscription.plan_code,
    subscription.status,
    subscription.trial_ends_at,
    subscription.current_period_ends_at,
    subscription.grace_period_ends_at
  from public.establishments establishment
  left join public.establishment_subscriptions subscription
    on subscription.establishment_id = establishment.id
  order by establishment.created_at desc;
end;
$$;

create function public.admin_update_establishment_subscription(
  target_establishment_id uuid,
  desired_plan public.subscription_plan,
  desired_status public.subscription_status,
  access_days integer default 30
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_subscription public.establishment_subscriptions%rowtype;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  if access_days < 1 or access_days > 365 then
    raise exception 'Access days must be between 1 and 365';
  end if;

  select * into target_subscription
  from public.establishment_subscriptions
  where establishment_id = target_establishment_id
  for update;

  if not found then
    raise exception 'Subscription not found';
  end if;

  update public.establishment_subscriptions
  set
    plan_code = desired_plan,
    status = desired_status,
    trial_starts_at = case when desired_status = 'trialing' then now() else trial_starts_at end,
    trial_ends_at = case when desired_status = 'trialing' then now() + make_interval(days => access_days) else trial_ends_at end,
    current_period_starts_at = case when desired_status = 'active' then now() else current_period_starts_at end,
    current_period_ends_at = case when desired_status = 'active' then now() + make_interval(days => access_days) when desired_status in ('canceled', 'expired') then now() else current_period_ends_at end,
    grace_period_ends_at = case when desired_status = 'past_due' then now() + make_interval(days => access_days) else null end,
    cancel_at_period_end = desired_status = 'canceled'
  where id = target_subscription.id;

  insert into public.subscription_events (subscription_id, event_type, actor_user_id, payload)
  values (
    target_subscription.id,
    'admin_subscription_updated',
    (select auth.uid()),
    jsonb_build_object(
      'previous_plan', target_subscription.plan_code,
      'previous_status', target_subscription.status,
      'new_plan', desired_plan,
      'new_status', desired_status,
      'access_days', access_days
    )
  );
end;
$$;

revoke all on function public.get_platform_admin_overview() from public;
revoke all on function public.admin_update_establishment_subscription(uuid, public.subscription_plan, public.subscription_status, integer) from public;
grant execute on function public.get_platform_admin_overview() to authenticated;
grant execute on function public.admin_update_establishment_subscription(uuid, public.subscription_plan, public.subscription_status, integer) to authenticated;
