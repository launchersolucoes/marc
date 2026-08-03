alter table public.subscription_events
  add column if not exists provider_event_id text;

create unique index if not exists subscription_events_provider_event_idx
  on public.subscription_events (provider_event_id)
  where provider_event_id is not null;

create or replace function public.set_subscription_billing_customer(
  target_establishment_id uuid,
  target_provider_customer_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_customer_id text;
begin
  if not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient establishment permissions';
  end if;

  if nullif(trim(target_provider_customer_id), '') is null then
    raise exception 'Invalid billing customer';
  end if;

  update public.establishment_subscriptions
  set billing_provider = 'stripe',
      provider_customer_id = target_provider_customer_id
  where establishment_id = target_establishment_id
    and (provider_customer_id is null or provider_customer_id = target_provider_customer_id)
  returning provider_customer_id into linked_customer_id;

  if linked_customer_id is null then
    select provider_customer_id into linked_customer_id
    from public.establishment_subscriptions
    where establishment_id = target_establishment_id;
  end if;

  return linked_customer_id;
end;
$$;

revoke all on function public.set_subscription_billing_customer(uuid, text) from public, anon;
grant execute on function public.set_subscription_billing_customer(uuid, text) to authenticated;

create or replace function public.apply_stripe_subscription_event(
  target_provider_event_id text,
  target_provider_event_type text,
  target_provider_subscription_id text,
  target_provider_customer_id text,
  target_establishment_id uuid,
  target_plan_code public.subscription_plan,
  target_status public.subscription_status,
  target_current_period_starts_at timestamptz,
  target_current_period_ends_at timestamptz,
  target_cancel_at_period_end boolean,
  target_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_subscription public.establishment_subscriptions%rowtype;
begin
  if exists (
    select 1 from public.subscription_events event
    where event.provider_event_id = target_provider_event_id
  ) then
    return jsonb_build_object('applied', false, 'reason', 'already_processed');
  end if;

  select subscription.* into target_subscription
  from public.establishment_subscriptions subscription
  where (target_provider_subscription_id is not null and subscription.provider_subscription_id = target_provider_subscription_id)
     or (target_provider_customer_id is not null and subscription.provider_customer_id = target_provider_customer_id)
     or (target_establishment_id is not null and subscription.establishment_id = target_establishment_id)
  order by
    (subscription.provider_subscription_id = target_provider_subscription_id) desc,
    (subscription.provider_customer_id = target_provider_customer_id) desc
  limit 1
  for update;

  if target_subscription.id is null then
    raise exception 'Subscription not found for Stripe event';
  end if;

  update public.establishment_subscriptions
  set billing_provider = 'stripe',
      provider_customer_id = coalesce(target_provider_customer_id, provider_customer_id),
      provider_subscription_id = coalesce(target_provider_subscription_id, provider_subscription_id),
      plan_code = coalesce(target_plan_code, plan_code),
      status = target_status,
      current_period_starts_at = target_current_period_starts_at,
      current_period_ends_at = target_current_period_ends_at,
      grace_period_ends_at = null,
      cancel_at_period_end = target_cancel_at_period_end
  where id = target_subscription.id;

  insert into public.subscription_events (
    subscription_id,
    event_type,
    provider_event_id,
    payload
  ) values (
    target_subscription.id,
    target_provider_event_type,
    target_provider_event_id,
    coalesce(target_payload, '{}'::jsonb)
  );

  return jsonb_build_object('applied', true, 'subscription_id', target_subscription.id);
end;
$$;

revoke all on function public.apply_stripe_subscription_event(
  text, text, text, text, uuid, public.subscription_plan, public.subscription_status,
  timestamptz, timestamptz, boolean, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(
  text, text, text, text, uuid, public.subscription_plan, public.subscription_status,
  timestamptz, timestamptz, boolean, jsonb
) to service_role;

create or replace function public.get_current_app_context()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'membership', jsonb_build_object(
      'role', membership.role,
      'establishment_id', membership.establishment_id
    ),
    'establishment', jsonb_build_object(
      'id', establishment.id,
      'name', establishment.name,
      'slug', establishment.slug,
      'timezone', establishment.timezone
    ),
    'subscription', case
      when subscription.id is null then null
      else jsonb_build_object(
        'id', subscription.id,
        'plan_code', subscription.plan_code,
        'status', subscription.status,
        'trial_starts_at', subscription.trial_starts_at,
        'trial_ends_at', subscription.trial_ends_at,
        'current_period_starts_at', subscription.current_period_starts_at,
        'current_period_ends_at', subscription.current_period_ends_at,
        'grace_period_ends_at', subscription.grace_period_ends_at,
        'cancel_at_period_end', subscription.cancel_at_period_end,
        'billing_provider', subscription.billing_provider,
        'provider_customer_id', subscription.provider_customer_id,
        'provider_subscription_id', subscription.provider_subscription_id
      )
    end,
    'professional', case
      when professional.id is null then null
      else jsonb_build_object(
        'id', professional.id,
        'display_name', professional.display_name
      )
    end
  )
  from public.establishment_memberships as membership
  join public.establishments as establishment
    on establishment.id = membership.establishment_id
  left join public.establishment_subscriptions as subscription
    on subscription.establishment_id = membership.establishment_id
  left join lateral (
    select candidate.id, candidate.display_name
    from public.professionals as candidate
    where candidate.establishment_id = membership.establishment_id
      and candidate.user_id = auth.uid()
    limit 1
  ) as professional on true
  where membership.user_id = auth.uid()
    and membership.status = 'active'
  order by membership.created_at
  limit 1;
$$;

revoke all on function public.get_current_app_context() from public, anon;
grant execute on function public.get_current_app_context() to authenticated;
