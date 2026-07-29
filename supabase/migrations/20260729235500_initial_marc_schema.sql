create extension if not exists btree_gist with schema extensions;

create type public.establishment_role as enum (
  'owner',
  'manager',
  'receptionist',
  'professional'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended'
);

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create type public.appointment_source as enum (
  'public_booking',
  'staff',
  'import'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  phone text,
  email text,
  address_line text,
  address_number text,
  address_complement text,
  neighborhood text,
  city text,
  state text,
  postal_code text,
  timezone text not null default 'America/Sao_Paulo',
  logo_path text,
  opening_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.establishment_memberships (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.establishment_role not null,
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, user_id)
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  bio text,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (establishment_id, user_id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, name)
);

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, service_id)
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create table public.professional_time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  professional_id uuid not null references public.professionals (id),
  professional_service_id uuid not null references public.professional_services (id),
  customer_id uuid not null references public.customers (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  source public.appointment_source not null default 'public_booking',
  price_cents integer not null check (price_cents >= 0),
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed', 'in_progress'))
);

create table public.appointment_events (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index establishment_memberships_user_idx
  on public.establishment_memberships (user_id, status);
create index professionals_establishment_idx
  on public.professionals (establishment_id, is_active);
create index services_establishment_idx
  on public.services (establishment_id, is_active);
create index customers_establishment_phone_idx
  on public.customers (establishment_id, phone);
create index appointments_establishment_starts_idx
  on public.appointments (establishment_id, starts_at);
create index appointments_professional_starts_idx
  on public.appointments (professional_id, starts_at);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger establishments_set_updated_at
  before update on public.establishments
  for each row execute function public.set_updated_at();
create trigger memberships_set_updated_at
  before update on public.establishment_memberships
  for each row execute function public.set_updated_at();
create trigger professionals_set_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();
create trigger professional_services_set_updated_at
  before update on public.professional_services
  for each row execute function public.set_updated_at();
create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.establishments enable row level security;
alter table public.establishment_memberships enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.professional_time_off enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_events enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

