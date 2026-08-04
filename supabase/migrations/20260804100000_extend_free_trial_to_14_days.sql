alter table public.establishment_subscriptions
  alter column trial_ends_at set default (now() + interval '14 days');

with extended_trials as (
  update public.establishment_subscriptions
  set trial_ends_at = greatest(trial_ends_at, trial_starts_at + interval '14 days')
  where status = 'trialing'
    and trial_ends_at > now()
    and trial_ends_at < trial_starts_at + interval '14 days'
  returning id
)
insert into public.subscription_events (subscription_id, event_type, payload)
select
  id,
  'trial_extended',
  jsonb_build_object('trial_days', 14, 'source', 'commercial_terms_update')
from extended_trials;
