drop function if exists public.get_platform_privacy_requests();

create function public.get_platform_privacy_requests(
  request_scope text default 'open',
  page_limit integer default 25,
  page_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_limit integer := least(greatest(page_limit, 1), 50);
  normalized_offset integer := greatest(page_offset, 0);
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access required';
  end if;
  if request_scope not in ('open', 'closed', 'all') then
    raise exception 'Unsupported privacy request scope';
  end if;

  return jsonb_build_object(
    'items', coalesce((
      select jsonb_agg(page.item order by page.sort_order, page.requested_at desc)
      from (
        select
          case request.status when 'pending' then 0 when 'in_review' then 1 else 2 end as sort_order,
          request.requested_at,
          jsonb_build_object(
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
            'subject_contact', case when customer.id is not null then coalesce(customer.email, customer.phone) else auth_user.email end,
            'subject_kind', case when customer.id is not null then 'customer' else 'user' end,
            'history', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', event.id,
                'previous_status', event.previous_status,
                'next_status', event.next_status,
                'notes', event.notes,
                'created_at', event.created_at,
                'actor_name', coalesce(actor_profile.full_name, actor_user.email, 'Administrador removido')
              ) order by event.created_at desc)
              from public.privacy_request_events event
              left join public.profiles actor_profile on actor_profile.id = event.actor_user_id
              left join auth.users actor_user on actor_user.id = event.actor_user_id
              where event.request_id = request.id
            ), '[]'::jsonb)
          ) as item
        from public.privacy_requests request
        join public.establishments establishment on establishment.id = request.establishment_id
        left join public.customers customer on customer.id = request.customer_id
        left join public.profiles profile on profile.id = request.requester_user_id
        left join auth.users auth_user on auth_user.id = request.requester_user_id
        where request_scope = 'all'
          or (request_scope = 'open' and request.status in ('pending', 'in_review'))
          or (request_scope = 'closed' and request.status in ('completed', 'rejected'))
        order by sort_order, request.requested_at desc
        limit normalized_limit offset normalized_offset
      ) page
    ), '[]'::jsonb),
    'total', (
      select count(*)
      from public.privacy_requests request
      where request_scope = 'all'
        or (request_scope = 'open' and request.status in ('pending', 'in_review'))
        or (request_scope = 'closed' and request.status in ('completed', 'rejected'))
    ),
    'open_total', (
      select count(*) from public.privacy_requests where status in ('pending', 'in_review')
    )
  );
end;
$$;

create or replace function public.admin_update_privacy_request(
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
  if not found then raise exception 'Privacy request not found'; end if;

  if target_request.status = desired_status
    and coalesce(target_request.resolution_notes, '') = coalesce(normalized_notes, '') then
    return;
  end if;

  update public.privacy_requests
  set status = desired_status,
      resolution_notes = normalized_notes,
      resolved_by = case when desired_status in ('completed', 'rejected') then (select auth.uid()) else null end,
      completed_at = case when desired_status in ('completed', 'rejected') then now() else null end,
      updated_at = now()
  where id = target_request_id;

  insert into public.privacy_request_events (request_id, actor_user_id, previous_status, next_status, notes)
  values (target_request_id, (select auth.uid()), target_request.status, desired_status, normalized_notes);
end;
$$;

revoke all on function public.get_platform_privacy_requests(text, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_update_privacy_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.get_platform_privacy_requests(text, integer, integer) to authenticated;
grant execute on function public.admin_update_privacy_request(uuid, text, text) to authenticated;
