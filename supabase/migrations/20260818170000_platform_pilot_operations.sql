create table public.platform_pilot_programs (
  establishment_id uuid primary key references public.establishments (id) on delete cascade,
  status text not null default 'preparing' check (status in ('preparing', 'ready', 'testing', 'paused', 'completed')),
  round smallint not null default 1 check (round between 1 and 3),
  checklist jsonb not null default '{}'::jsonb,
  notes text not null default '',
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.platform_pilot_issues (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  area text not null check (area in ('agenda', 'clientes', 'servicos', 'equipe', 'financeiro', 'relatorios', 'pwa', 'acesso', 'outro')),
  priority text not null check (priority in ('p1', 'p2', 'p3')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'wont_fix')),
  reproduction_steps text not null default '',
  resolution_notes text not null default '',
  reported_by uuid references auth.users (id) on delete set null,
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index platform_pilot_issues_establishment_status_idx
  on public.platform_pilot_issues (establishment_id, status, priority, created_at desc);

alter table public.platform_pilot_programs enable row level security;
alter table public.platform_pilot_issues enable row level security;

revoke all on table public.platform_pilot_programs from public, anon, authenticated;
revoke all on table public.platform_pilot_issues from public, anon, authenticated;

create function public.get_platform_pilot_dashboard(target_establishment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  if not exists (select 1 from public.establishments where id = target_establishment_id) then
    raise exception 'Establishment not found';
  end if;

  select jsonb_build_object(
    'program', (
      select jsonb_build_object(
        'status', program.status,
        'round', program.round,
        'checklist', program.checklist,
        'notes', program.notes,
        'started_at', program.started_at,
        'updated_at', program.updated_at
      )
      from public.platform_pilot_programs program
      where program.establishment_id = target_establishment_id
    ),
    'counts', jsonb_build_object(
      'owners', (select count(*) from public.establishment_memberships where establishment_id = target_establishment_id and status = 'active' and role = 'owner'),
      'managers', (select count(*) from public.establishment_memberships where establishment_id = target_establishment_id and status = 'active' and role = 'manager'),
      'receptionists', (select count(*) from public.establishment_memberships where establishment_id = target_establishment_id and status = 'active' and role = 'receptionist'),
      'professional_members', (select count(*) from public.establishment_memberships where establishment_id = target_establishment_id and status = 'active' and role = 'professional'),
      'professionals', (select count(*) from public.professionals where establishment_id = target_establishment_id and is_active),
      'services', (select count(*) from public.services where establishment_id = target_establishment_id and is_active),
      'offerings', (
        select count(*)
        from public.professional_services offering
        join public.professionals professional on professional.id = offering.professional_id
        where professional.establishment_id = target_establishment_id and offering.is_active
      ),
      'availability_rules', (
        select count(*)
        from public.availability_rules availability
        join public.professionals professional on professional.id = availability.professional_id
        where professional.establishment_id = target_establishment_id
      ),
      'appointments', (select count(*) from public.appointments where establishment_id = target_establishment_id),
      'appointment_events', (select count(*) from public.operational_audit_events where establishment_id = target_establishment_id and event_name = 'appointment.created'),
      'financial_closings', (select count(*) from public.financial_day_closings where establishment_id = target_establishment_id and status = 'closed')
    ),
    'issues', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', issue.id,
        'title', issue.title,
        'area', issue.area,
        'priority', issue.priority,
        'status', issue.status,
        'reproduction_steps', issue.reproduction_steps,
        'resolution_notes', issue.resolution_notes,
        'created_at', issue.created_at,
        'updated_at', issue.updated_at
      ) order by
        case issue.priority when 'p1' then 1 when 'p2' then 2 else 3 end,
        issue.created_at desc
      )
      from public.platform_pilot_issues issue
      where issue.establishment_id = target_establishment_id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_name', event.event_name,
        'entity_type', event.entity_type,
        'created_at', event.created_at
      ) order by event.created_at desc)
      from (
        select audit.event_name, audit.entity_type, audit.created_at
        from public.operational_audit_events audit
        where audit.establishment_id = target_establishment_id
        order by audit.created_at desc
        limit 12
      ) event
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create function public.admin_update_pilot_program(
  target_establishment_id uuid,
  desired_status text,
  desired_round integer,
  desired_notes text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if desired_status not in ('preparing', 'ready', 'testing', 'paused', 'completed') or desired_round not between 1 and 3 then
    raise exception 'Invalid pilot program state';
  end if;

  insert into public.platform_pilot_programs (establishment_id, status, round, notes, updated_by)
  values (target_establishment_id, desired_status, desired_round, left(coalesce(desired_notes, ''), 1000), (select auth.uid()))
  on conflict (establishment_id) do update set
    status = excluded.status,
    round = excluded.round,
    notes = excluded.notes,
    updated_at = now(),
    updated_by = excluded.updated_by;
end;
$$;

create function public.admin_update_pilot_check_item(
  target_establishment_id uuid,
  item_key text,
  item_status text,
  item_note text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if item_key !~ '^[a-z0-9_]{2,60}$' or item_status not in ('pending', 'passed', 'failed', 'blocked') then
    raise exception 'Invalid pilot checklist item';
  end if;

  insert into public.platform_pilot_programs (establishment_id, updated_by)
  values (target_establishment_id, (select auth.uid()))
  on conflict (establishment_id) do nothing;

  update public.platform_pilot_programs
  set checklist = jsonb_set(
        checklist,
        array[item_key],
        jsonb_build_object(
          'status', item_status,
          'note', left(coalesce(item_note, ''), 500),
          'updated_at', now(),
          'updated_by', (select auth.uid())
        ),
        true
      ),
      updated_at = now(),
      updated_by = (select auth.uid())
  where establishment_id = target_establishment_id;
end;
$$;

create function public.admin_create_pilot_issue(
  target_establishment_id uuid,
  issue_title text,
  issue_area text,
  issue_priority text,
  issue_reproduction_steps text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_issue_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if char_length(trim(issue_title)) not between 3 and 140
    or issue_area not in ('agenda', 'clientes', 'servicos', 'equipe', 'financeiro', 'relatorios', 'pwa', 'acesso', 'outro')
    or issue_priority not in ('p1', 'p2', 'p3') then
    raise exception 'Invalid pilot issue';
  end if;

  insert into public.platform_pilot_issues (
    establishment_id, title, area, priority, reproduction_steps, reported_by
  ) values (
    target_establishment_id,
    trim(issue_title),
    issue_area,
    issue_priority,
    left(coalesce(issue_reproduction_steps, ''), 2000),
    (select auth.uid())
  ) returning id into created_issue_id;

  return created_issue_id;
end;
$$;

create function public.admin_update_pilot_issue(
  target_issue_id uuid,
  desired_status text,
  desired_resolution_notes text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if desired_status not in ('open', 'in_progress', 'resolved', 'wont_fix') then
    raise exception 'Invalid pilot issue state';
  end if;

  update public.platform_pilot_issues
  set status = desired_status,
      resolution_notes = left(coalesce(desired_resolution_notes, ''), 2000),
      resolved_at = case when desired_status in ('resolved', 'wont_fix') then now() else null end,
      resolved_by = case when desired_status in ('resolved', 'wont_fix') then (select auth.uid()) else null end,
      updated_at = now()
  where id = target_issue_id;

  if not found then raise exception 'Pilot issue not found'; end if;
end;
$$;

revoke all on function public.get_platform_pilot_dashboard(uuid) from public;
revoke all on function public.admin_update_pilot_program(uuid, text, integer, text) from public;
revoke all on function public.admin_update_pilot_check_item(uuid, text, text, text) from public;
revoke all on function public.admin_create_pilot_issue(uuid, text, text, text, text) from public;
revoke all on function public.admin_update_pilot_issue(uuid, text, text) from public;

grant execute on function public.get_platform_pilot_dashboard(uuid) to authenticated;
grant execute on function public.admin_update_pilot_program(uuid, text, integer, text) to authenticated;
grant execute on function public.admin_update_pilot_check_item(uuid, text, text, text) to authenticated;
grant execute on function public.admin_create_pilot_issue(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_update_pilot_issue(uuid, text, text) to authenticated;
