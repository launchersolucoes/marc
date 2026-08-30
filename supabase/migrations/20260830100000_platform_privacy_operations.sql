alter table public.privacy_requests
  add column if not exists resolution_notes text,
  add column if not exists resolved_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.privacy_requests
  drop constraint if exists privacy_requests_resolution_notes_check;

alter table public.privacy_requests
  add constraint privacy_requests_resolution_notes_check
  check (resolution_notes is null or length(resolution_notes) <= 1200);

create table public.privacy_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  previous_status text not null,
  next_status text not null,
  notes text,
  created_at timestamptz not null default now(),
  check (previous_status in ('pending', 'in_review', 'completed', 'rejected')),
  check (next_status in ('pending', 'in_review', 'completed', 'rejected')),
  check (notes is null or length(notes) <= 1200)
);

create index privacy_request_events_request_created_idx
  on public.privacy_request_events (request_id, created_at desc);

alter table public.privacy_request_events enable row level security;

create policy "Platform admins can read privacy request events"
  on public.privacy_request_events for select
  to authenticated
  using (public.is_platform_admin());

revoke all on table public.privacy_request_events from public, anon, authenticated;
grant select on table public.privacy_request_events to authenticated;

create function public.get_platform_privacy_requests()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', request.id,
      'establishment_id', request.establishment_id,
      'establishment_name', establishment.name,
      'request_type', request.request_type,
      'source', request.source,
      'status', request.status,
      'details', request.details,
      'resolution_notes', request.resolution_notes,
      'requested_at', request.requested_at,
      'updated_at', request.updated_at,
      'completed_at', request.completed_at,
      'subject_name', coalesce(customer.full_name, profile.full_name, auth_user.email, 'Solicitante sem identificação ativa'),
      'subject_contact', case
        when customer.id is not null then coalesce(customer.email, customer.phone)
        else auth_user.email
      end,
      'subject_kind', case when customer.id is not null then 'customer' else 'user' end,
      'history_count', (select count(*) from public.privacy_request_events event where event.request_id = request.id)
    ) order by
      case request.status when 'pending' then 0 when 'in_review' then 1 else 2 end,
      request.requested_at desc
    )
    from public.privacy_requests request
    join public.establishments establishment on establishment.id = request.establishment_id
    left join public.customers customer on customer.id = request.customer_id
    left join public.profiles profile on profile.id = request.requester_user_id
    left join auth.users auth_user on auth_user.id = request.requester_user_id
  ), '[]'::jsonb);
end;
$$;

create function public.admin_update_privacy_request(
  target_request_id uuid,
  desired_status text,
  decision_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_request public.privacy_requests%rowtype;
  normalized_notes text := nullif(trim(decision_notes), '');
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if desired_status not in ('pending', 'in_review', 'completed', 'rejected') then
    raise exception 'Unsupported privacy request status';
  end if;
  if desired_status in ('completed', 'rejected') and normalized_notes is null then
    raise exception 'Decision notes are required';
  end if;
  if length(coalesce(normalized_notes, '')) > 1200 then
    raise exception 'Decision notes are too long';
  end if;

  select * into target_request
  from public.privacy_requests
  where id = target_request_id
  for update;

  if not found then
    raise exception 'Privacy request not found';
  end if;

  update public.privacy_requests
  set status = desired_status,
      resolution_notes = normalized_notes,
      resolved_by = case when desired_status in ('completed', 'rejected') then (select auth.uid()) else null end,
      completed_at = case when desired_status in ('completed', 'rejected') then now() else null end,
      updated_at = now()
  where id = target_request_id;

  insert into public.privacy_request_events (
    request_id, actor_user_id, previous_status, next_status, notes
  ) values (
    target_request_id, (select auth.uid()), target_request.status, desired_status, normalized_notes
  );
end;
$$;

revoke all on function public.get_platform_privacy_requests() from public, anon, authenticated;
revoke all on function public.admin_update_privacy_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.get_platform_privacy_requests() to authenticated;
grant execute on function public.admin_update_privacy_request(uuid, text, text) to authenticated;
