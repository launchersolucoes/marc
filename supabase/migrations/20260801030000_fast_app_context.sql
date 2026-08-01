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
        'cancel_at_period_end', subscription.cancel_at_period_end
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
