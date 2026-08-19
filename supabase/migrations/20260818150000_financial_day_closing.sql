create table public.financial_day_closings (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  business_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  expected_totals jsonb not null default '{}'::jsonb,
  declared_totals jsonb not null default '{}'::jsonb,
  difference_totals jsonb not null default '{}'::jsonb,
  expense_total_cents integer not null default 0 check (expense_total_cents >= 0),
  notes text,
  closed_by uuid references auth.users (id) on delete set null,
  closed_at timestamptz,
  reopened_by uuid references auth.users (id) on delete set null,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (establishment_id, business_date),
  check (notes is null or length(notes) <= 500),
  check (reopen_reason is null or length(trim(reopen_reason)) between 3 and 240)
);

create index financial_day_closings_establishment_date_idx
  on public.financial_day_closings (establishment_id, business_date desc);

create table public.financial_closing_events (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  closing_id uuid not null references public.financial_day_closings (id) on delete restrict,
  event_type text not null check (event_type in ('closed', 'reopened')),
  actor_user_id uuid references auth.users (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index financial_closing_events_closing_created_idx
  on public.financial_closing_events (closing_id, created_at desc);

alter table public.financial_day_closings enable row level security;
alter table public.financial_closing_events enable row level security;

create policy "Managers can read financial day closings"
  on public.financial_day_closings for select
  to authenticated
  using (public.can_manage_establishment(establishment_id));

create policy "Managers can read financial closing events"
  on public.financial_closing_events for select
  to authenticated
  using (public.can_manage_establishment(establishment_id));

revoke all on table public.financial_day_closings from public, anon, authenticated;
revoke all on table public.financial_closing_events from public, anon, authenticated;
grant select on table public.financial_day_closings to authenticated;
grant select on table public.financial_closing_events to authenticated;

create function public.close_financial_day(
  target_establishment_id uuid,
  target_business_date date,
  declared_cash_cents integer,
  declared_pix_cents integer,
  declared_credit_card_cents integer,
  declared_debit_card_cents integer,
  declared_other_cents integer,
  closing_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  establishment_timezone text;
  closing_record public.financial_day_closings%rowtype;
  expected_cash integer := 0;
  expected_pix integer := 0;
  expected_credit integer := 0;
  expected_debit integer := 0;
  expected_other integer := 0;
  expense_total integer := 0;
  expected jsonb;
  declared jsonb;
  differences jsonb;
begin
  if not public.can_manage_establishment(target_establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  select timezone into establishment_timezone
  from public.establishments
  where id = target_establishment_id;

  if target_business_date is null
    or target_business_date > (now() at time zone establishment_timezone)::date
    or target_business_date < ((now() at time zone establishment_timezone)::date - 370)
    or declared_cash_cents < 0
    or declared_pix_cents < 0
    or declared_credit_card_cents < 0
    or declared_debit_card_cents < 0
    or declared_other_cents < 0
    or greatest(declared_cash_cents, declared_pix_cents, declared_credit_card_cents, declared_debit_card_cents, declared_other_cents) > 1000000000
    or length(coalesce(closing_notes, '')) > 500 then
    raise exception 'Invalid closing data';
  end if;

  select * into closing_record
  from public.financial_day_closings
  where establishment_id = target_establishment_id
    and business_date = target_business_date
  for update;

  if closing_record.id is not null and closing_record.status = 'closed' then
    raise exception 'Financial day already closed';
  end if;

  select
    coalesce(sum(amount_cents) filter (where type = 'income' and payment_method = 'cash'), 0),
    coalesce(sum(amount_cents) filter (where type = 'income' and payment_method = 'pix'), 0),
    coalesce(sum(amount_cents) filter (where type = 'income' and payment_method = 'credit_card'), 0),
    coalesce(sum(amount_cents) filter (where type = 'income' and payment_method = 'debit_card'), 0),
    coalesce(sum(amount_cents) filter (where type = 'income' and payment_method = 'other'), 0),
    coalesce(sum(amount_cents) filter (where type = 'expense'), 0)
  into expected_cash, expected_pix, expected_credit, expected_debit, expected_other, expense_total
  from public.financial_entries
  where establishment_id = target_establishment_id
    and voided_at is null
    and (occurred_at at time zone establishment_timezone)::date = target_business_date;

  expected := jsonb_build_object(
    'cash', expected_cash,
    'pix', expected_pix,
    'credit_card', expected_credit,
    'debit_card', expected_debit,
    'other', expected_other
  );
  declared := jsonb_build_object(
    'cash', declared_cash_cents,
    'pix', declared_pix_cents,
    'credit_card', declared_credit_card_cents,
    'debit_card', declared_debit_card_cents,
    'other', declared_other_cents
  );
  differences := jsonb_build_object(
    'cash', declared_cash_cents - expected_cash,
    'pix', declared_pix_cents - expected_pix,
    'credit_card', declared_credit_card_cents - expected_credit,
    'debit_card', declared_debit_card_cents - expected_debit,
    'other', declared_other_cents - expected_other
  );

  insert into public.financial_day_closings (
    establishment_id, business_date, status, expected_totals, declared_totals,
    difference_totals, expense_total_cents, notes, closed_by, closed_at,
    reopened_by, reopened_at, reopen_reason, updated_at
  ) values (
    target_establishment_id, target_business_date, 'closed', expected, declared,
    differences, expense_total, nullif(trim(closing_notes), ''), (select auth.uid()), now(),
    null, null, null, now()
  )
  on conflict (establishment_id, business_date) do update
  set status = 'closed',
      expected_totals = excluded.expected_totals,
      declared_totals = excluded.declared_totals,
      difference_totals = excluded.difference_totals,
      expense_total_cents = excluded.expense_total_cents,
      notes = excluded.notes,
      closed_by = excluded.closed_by,
      closed_at = excluded.closed_at,
      reopened_by = null,
      reopened_at = null,
      reopen_reason = null,
      updated_at = now()
  returning * into closing_record;

  insert into public.financial_closing_events (
    establishment_id, closing_id, event_type, actor_user_id, details
  ) values (
    target_establishment_id,
    closing_record.id,
    'closed',
    (select auth.uid()),
    jsonb_build_object(
      'business_date', target_business_date,
      'expected', expected,
      'declared', declared,
      'differences', differences,
      'expense_total_cents', expense_total,
      'notes', nullif(trim(closing_notes), '')
    )
  );

  return closing_record.id;
end;
$$;

create function public.reopen_financial_day(
  target_closing_id uuid,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  closing_record public.financial_day_closings%rowtype;
begin
  select * into closing_record
  from public.financial_day_closings
  where id = target_closing_id
  for update;

  if closing_record.id is null then
    raise exception 'Financial closing not found';
  end if;

  if not public.can_manage_establishment(closing_record.establishment_id) then
    raise exception 'Insufficient permission';
  end if;

  if closing_record.status <> 'closed' then
    raise exception 'Financial day is already open';
  end if;

  if length(trim(reason)) not between 3 and 240 then
    raise exception 'Invalid reopen reason';
  end if;

  update public.financial_day_closings
  set status = 'open',
      reopened_by = (select auth.uid()),
      reopened_at = now(),
      reopen_reason = trim(reason),
      updated_at = now()
  where id = closing_record.id;

  insert into public.financial_closing_events (
    establishment_id, closing_id, event_type, actor_user_id, details
  ) values (
    closing_record.establishment_id,
    closing_record.id,
    'reopened',
    (select auth.uid()),
    jsonb_build_object('reason', trim(reason), 'business_date', closing_record.business_date)
  );

  return closing_record.id;
end;
$$;

revoke all on function public.close_financial_day(uuid, date, integer, integer, integer, integer, integer, text) from public;
revoke all on function public.reopen_financial_day(uuid, text) from public;
grant execute on function public.close_financial_day(uuid, date, integer, integer, integer, integer, integer, text) to authenticated;
grant execute on function public.reopen_financial_day(uuid, text) to authenticated;
