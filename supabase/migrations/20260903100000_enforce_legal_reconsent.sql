alter table public.legal_document_acceptances
  drop constraint if exists legal_document_acceptances_source_check;

alter table public.legal_document_acceptances
  add constraint legal_document_acceptances_source_check
  check (source in ('onboarding', 'invitation', 'settings', 'reconsent'));

create or replace function public._record_current_legal_acceptance(
  target_user_id uuid,
  terms_version text,
  terms_content_sha256 text,
  privacy_version text,
  privacy_content_sha256 text,
  trusted_source text,
  target_establishment_id uuid default null,
  acceptance_confirmed boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_terms_version text;
  current_terms_sha256 text;
  current_privacy_version text;
  current_privacy_sha256 text;
  current_subject_reference text;
begin
  if current_user_id is null or target_user_id is distinct from current_user_id then
    raise exception 'Authentication required';
  end if;
  if not acceptance_confirmed then raise exception 'Legal acceptance must be explicit'; end if;
  if trusted_source not in ('onboarding', 'invitation', 'settings', 'reconsent') then
    raise exception 'Invalid acceptance source';
  end if;
  if target_establishment_id is not null and not public.has_establishment_access(target_establishment_id) then
    raise exception 'Establishment access required';
  end if;

  select version, content_sha256 into current_terms_version, current_terms_sha256
  from public.legal_documents where document_type = 'terms' and is_current;
  select version, content_sha256 into current_privacy_version, current_privacy_sha256
  from public.legal_documents where document_type = 'privacy' and is_current;

  if terms_version is distinct from current_terms_version
    or terms_content_sha256 is distinct from current_terms_sha256
    or privacy_version is distinct from current_privacy_version
    or privacy_content_sha256 is distinct from current_privacy_sha256 then
    raise exception 'Legal document version changed';
  end if;

  current_subject_reference := encode(
    extensions.digest(convert_to(current_user_id::text || ':marc-legal-evidence-v1', 'UTF8'), 'sha256'),
    'hex'
  );

  insert into public.legal_document_acceptances (
    user_id, subject_reference, establishment_id, document_type, document_version, source
  )
  values
    (current_user_id, current_subject_reference, target_establishment_id, 'terms', current_terms_version, trusted_source),
    (current_user_id, current_subject_reference, target_establishment_id, 'privacy', current_privacy_version, trusted_source)
  on conflict do nothing;
end;
$$;

create function public.record_reconsent_legal_acceptance(
  terms_version text,
  terms_content_sha256 text,
  privacy_version text,
  privacy_content_sha256 text,
  target_establishment_id uuid,
  acceptance_confirmed boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._record_current_legal_acceptance(
    (select auth.uid()), terms_version, terms_content_sha256, privacy_version,
    privacy_content_sha256, 'reconsent', target_establishment_id, acceptance_confirmed
  );
end;
$$;

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
    end,
    'legal_acceptance_current', not exists (
      select 1
      from public.legal_documents as document
      where document.is_current
        and not exists (
          select 1
          from public.legal_document_acceptances as acceptance
          where acceptance.user_id = auth.uid()
            and acceptance.document_type = document.document_type
            and acceptance.document_version = document.version
        )
    )
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

revoke all on function public.record_reconsent_legal_acceptance(text, text, text, text, uuid, boolean) from public, anon;
revoke all on function public.get_current_app_context() from public, anon;
grant execute on function public.record_reconsent_legal_acceptance(text, text, text, text, uuid, boolean) to authenticated;
grant execute on function public.get_current_app_context() to authenticated;
