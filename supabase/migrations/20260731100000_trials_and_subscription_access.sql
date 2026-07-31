create type public.subscription_plan as enum ('starter', 'pro', 'max');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create table public.establishment_subscriptions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null unique references public.establishments (id) on delete cascade,
  plan_code public.subscription_plan not null default 'starter',
  status public.subscription_status not null default 'trialing',
  trial_starts_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  grace_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  billing_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trial_ends_at > trial_starts_at),
  check (current_period_ends_at is null or current_period_starts_at is null or current_period_ends_at > current_period_starts_at)
);

create unique index establishment_subscriptions_provider_customer_idx
  on public.establishment_subscriptions (billing_provider, provider_customer_id)
  where provider_customer_id is not null;

create unique index establishment_subscriptions_provider_subscription_idx
  on public.establishment_subscriptions (billing_provider, provider_subscription_id)
  where provider_subscription_id is not null;

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.establishment_subscriptions (id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index subscription_events_subscription_created_idx
  on public.subscription_events (subscription_id, created_at desc);

create trigger establishment_subscriptions_set_updated_at
  before update on public.establishment_subscriptions
  for each row execute function public.set_updated_at();

create function public.initialize_establishment_trial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_subscription_id uuid;
begin
  insert into public.establishment_subscriptions (establishment_id)
  values (new.id)
  on conflict (establishment_id) do nothing
  returning id into new_subscription_id;

  if new_subscription_id is not null then
    insert into public.subscription_events (subscription_id, event_type, actor_user_id)
    values (new_subscription_id, 'trial_started', new.created_by);
  end if;

  return new;
end;
$$;

create trigger establishments_initialize_trial
  after insert on public.establishments
  for each row execute function public.initialize_establishment_trial();

insert into public.establishment_subscriptions (establishment_id, trial_starts_at, trial_ends_at)
select id, now(), now() + interval '7 days'
from public.establishments
on conflict (establishment_id) do nothing;

insert into public.subscription_events (subscription_id, event_type, payload)
select subscription.id, 'trial_started', jsonb_build_object('source', 'migration_backfill')
from public.establishment_subscriptions subscription
where not exists (
  select 1 from public.subscription_events event
  where event.subscription_id = subscription.id
    and event.event_type = 'trial_started'
);

create function public.establishment_has_product_access(target_establishment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when subscription.status = 'trialing' then subscription.trial_ends_at > now()
      when subscription.status = 'active' then subscription.current_period_ends_at is null or subscription.current_period_ends_at > now()
      when subscription.status = 'past_due' then subscription.grace_period_ends_at is not null and subscription.grace_period_ends_at > now()
      else false
    end
    from public.establishment_subscriptions subscription
    where subscription.establishment_id = target_establishment_id
  ), false);
$$;

create function public.enforce_operational_write_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_establishment_id uuid;
begin
  target_establishment_id := case when tg_op = 'DELETE' then old.establishment_id else new.establishment_id end;

  if not public.establishment_has_product_access(target_establishment_id) then
    raise exception 'Subscription inactive';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger appointments_require_product_access
  before insert or update or delete on public.appointments
  for each row execute function public.enforce_operational_write_access();

create trigger waitlist_require_product_access
  before insert or update or delete on public.waitlist_entries
  for each row execute function public.enforce_operational_write_access();

alter table public.establishment_subscriptions enable row level security;
alter table public.subscription_events enable row level security;

create policy "Members can read their establishment subscription"
  on public.establishment_subscriptions for select
  to authenticated
  using (public.has_establishment_access(establishment_id));

create policy "Platform admins can manage subscriptions"
  on public.establishment_subscriptions for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Leaders can read subscription events"
  on public.subscription_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.establishment_subscriptions subscription
      where subscription.id = subscription_events.subscription_id
        and public.can_manage_establishment(subscription.establishment_id)
    )
    or public.is_platform_admin()
  );

create policy "Platform admins can manage subscription events"
  on public.subscription_events for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

revoke all on public.establishment_subscriptions from anon, authenticated;
revoke all on public.subscription_events from anon, authenticated;
grant select on public.establishment_subscriptions to authenticated;
grant select on public.subscription_events to authenticated;
grant insert, update, delete on public.establishment_subscriptions to authenticated;
grant insert, update, delete on public.subscription_events to authenticated;

create or replace function public.get_public_booking_page(establishment_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', establishment.id,
    'name', establishment.name,
    'slug', establishment.slug,
    'category', establishment.category,
    'phone', establishment.phone,
    'address', concat_ws(', ', nullif(establishment.address_line, ''), nullif(establishment.address_number, '')),
    'city', establishment.city,
    'state', establishment.state,
    'offerings', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', professional_service.id,
          'price_cents', professional_service.price_cents,
          'duration_minutes', professional_service.duration_minutes,
          'professional_id', professional.id,
          'professional_name', professional.display_name,
          'professional_color', professional.color,
          'service_id', service.id,
          'service_name', service.name,
          'service_description', service.description
        )
        order by service.name, professional.display_name
      )
      from public.professional_services professional_service
      join public.professionals professional on professional.id = professional_service.professional_id
      join public.services service on service.id = professional_service.service_id
      where professional.establishment_id = establishment.id
        and professional.is_active
        and professional_service.is_active
        and service.is_active
    ), '[]'::jsonb)
  )
  from public.establishments establishment
  where establishment.slug = establishment_slug
    and establishment.is_active
    and public.establishment_has_product_access(establishment.id);
$$;

grant execute on function public.establishment_has_product_access(uuid) to anon, authenticated;
