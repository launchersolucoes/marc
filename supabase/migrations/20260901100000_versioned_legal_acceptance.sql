create table public.legal_documents (
  document_type text not null check (document_type in ('terms', 'privacy')),
  version text not null check (length(trim(version)) between 1 and 40),
  title text not null,
  content_path text not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  published_at timestamptz not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (document_type, version)
);

create unique index legal_documents_one_current_per_type on public.legal_documents (document_type) where is_current;

create table public.legal_document_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  subject_reference text not null check (subject_reference ~ '^[0-9a-f]{64}$'),
  establishment_id uuid references public.establishments (id) on delete restrict,
  document_type text not null,
  document_version text not null,
  source text not null check (source in ('onboarding', 'invitation', 'settings')),
  accepted_at timestamptz not null default now(),
  foreign key (document_type, document_version)
    references public.legal_documents (document_type, version) on delete restrict
);

create unique index legal_acceptances_global_unique
  on public.legal_document_acceptances (subject_reference, document_type, document_version)
  where establishment_id is null;

create unique index legal_acceptances_establishment_unique
  on public.legal_document_acceptances (subject_reference, establishment_id, document_type, document_version)
  where establishment_id is not null;

create index legal_acceptances_user_date_idx
  on public.legal_document_acceptances (user_id, accepted_at desc) where user_id is not null;

alter table public.legal_documents enable row level security;
alter table public.legal_document_acceptances enable row level security;

create policy "Anyone can read published legal documents"
  on public.legal_documents for select to anon, authenticated
  using (published_at <= now());

create policy "Users can read their own legal acceptances"
  on public.legal_document_acceptances for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Platform admins can read legal acceptances"
  on public.legal_document_acceptances for select to authenticated
  using (public.is_platform_admin());

insert into public.legal_documents (
  document_type, version, title, content_path, content_sha256, published_at, is_current
)
values
  ('terms', '2026-08-29', 'Termos de Uso', '/termos', '5b3a2c77967c6d5eae3da876ae591bf1712761d078c7f0a9c5f7effffe3fe4b5', '2026-08-29 00:00:00-03', true),
  ('privacy', '2026-08-30', 'Política de Privacidade', '/privacidade', '1d5b46e1ea22d876fb1180aeb9138a05f8021b20fb2cbc67788a5c1a1c528d5e', '2026-08-30 00:00:00-03', true);

create function public.protect_accepted_legal_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and exists (
    select 1 from public.legal_document_acceptances acceptance
    where acceptance.document_type = old.document_type
      and acceptance.document_version = old.version
  ) then
    raise exception 'Accepted legal document evidence is immutable';
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1 from public.legal_document_acceptances acceptance
    where acceptance.document_type = old.document_type
      and acceptance.document_version = old.version
  ) and (
    new.document_type is distinct from old.document_type
    or new.version is distinct from old.version
    or new.title is distinct from old.title
    or new.content_path is distinct from old.content_path
    or new.content_sha256 is distinct from old.content_sha256
    or new.published_at is distinct from old.published_at
  ) then
    raise exception 'Accepted legal document evidence is immutable';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_accepted_legal_document
before update or delete on public.legal_documents
for each row execute function public.protect_accepted_legal_document();

create function public.has_current_legal_acceptance(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id is not null
    and target_user_id = (select auth.uid())
    and not exists (
      select 1 from public.legal_documents document
      where document.is_current
        and not exists (
          select 1 from public.legal_document_acceptances acceptance
          where acceptance.user_id = target_user_id
            and acceptance.document_type = document.document_type
            and acceptance.document_version = document.version
        )
    );
$$;

create function public._record_current_legal_acceptance(
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
  if trusted_source not in ('onboarding', 'invitation', 'settings') then raise exception 'Invalid acceptance source'; end if;
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

create function public.record_settings_legal_acceptance(
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
    privacy_content_sha256, 'settings', target_establishment_id, acceptance_confirmed
  );
end;
$$;

drop function public.onboard_establishment(text, text, text, text, text, text, text, text, boolean);

create function public.onboard_establishment(
  establishment_name text,
  establishment_slug text,
  establishment_phone text,
  establishment_email text,
  establishment_category text,
  terms_version text,
  terms_content_sha256 text,
  privacy_version text,
  privacy_content_sha256 text,
  acceptance_confirmed boolean default false,
  establishment_address text default null,
  establishment_city text default null,
  establishment_state text default null,
  owner_works_here boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_establishment_id uuid;
  owner_name text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if length(trim(establishment_name)) < 2 then raise exception 'Invalid establishment name'; end if;
  if establishment_category not in ('barbershop', 'salon', 'nail_studio', 'beauty_studio', 'other') then
    raise exception 'Invalid establishment category';
  end if;

  perform public._record_current_legal_acceptance(
    current_user_id, terms_version, terms_content_sha256, privacy_version,
    privacy_content_sha256, 'onboarding', null, acceptance_confirmed
  );

  insert into public.establishments (
    name, slug, phone, email, category, address_line, city, state, created_by
  )
  values (
    trim(establishment_name), trim(establishment_slug), nullif(trim(establishment_phone), ''),
    nullif(trim(establishment_email), ''), establishment_category,
    nullif(trim(establishment_address), ''), nullif(trim(establishment_city), ''),
    nullif(upper(trim(establishment_state)), ''), current_user_id
  )
  returning id into new_establishment_id;

  insert into public.establishment_memberships (establishment_id, user_id, role, status)
  values (new_establishment_id, current_user_id, 'owner', 'active');

  perform public._record_current_legal_acceptance(
    current_user_id, terms_version, terms_content_sha256, privacy_version,
    privacy_content_sha256, 'onboarding', new_establishment_id, acceptance_confirmed
  );

  if owner_works_here then
    select full_name into owner_name from public.profiles where id = current_user_id;
    insert into public.professionals (establishment_id, user_id, display_name)
    values (
      new_establishment_id, current_user_id,
      coalesce(nullif(owner_name, ''), split_part(establishment_email, '@', 1), 'Profissional')
    );
  end if;

  return new_establishment_id;
end;
$$;

drop function public.accept_team_invitation(uuid);

create function public.accept_team_invitation(
  invitation_token uuid,
  terms_version text,
  terms_content_sha256 text,
  privacy_version text,
  privacy_content_sha256 text,
  acceptance_confirmed boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  invitation_record public.establishment_invitations%rowtype;
  profile_name text;
  linked_professional_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select lower(email) into current_email from auth.users where id = current_user_id;
  select * into invitation_record from public.establishment_invitations
  where token = invitation_token for update;

  if invitation_record.id is null or invitation_record.status <> 'pending' or invitation_record.expires_at <= now() then
    raise exception 'Invitation is not available';
  end if;
  if lower(invitation_record.email) <> current_email then raise exception 'Invitation belongs to another email'; end if;

  perform public._record_current_legal_acceptance(
    current_user_id, terms_version, terms_content_sha256, privacy_version,
    privacy_content_sha256, 'invitation', null, acceptance_confirmed
  );

  insert into public.establishment_memberships (establishment_id, user_id, role, status)
  values (invitation_record.establishment_id, current_user_id, invitation_record.role, 'active')
  on conflict (establishment_id, user_id) do update set role = excluded.role, status = 'active';

  perform public._record_current_legal_acceptance(
    current_user_id, terms_version, terms_content_sha256, privacy_version,
    privacy_content_sha256, 'invitation', invitation_record.establishment_id, acceptance_confirmed
  );

  if invitation_record.role = 'professional' then
    linked_professional_id := invitation_record.professional_id;
    if linked_professional_id is null then
      select full_name into profile_name from public.profiles where id = current_user_id;
      insert into public.professionals (establishment_id, user_id, display_name, contact_email)
      values (
        invitation_record.establishment_id, current_user_id,
        coalesce(nullif(profile_name, ''), split_part(current_email, '@', 1)), current_email
      ) returning id into linked_professional_id;
    else
      update public.professionals set user_id = current_user_id, contact_email = current_email
      where id = linked_professional_id
        and establishment_id = invitation_record.establishment_id
        and user_id is null;
    end if;
  end if;

  update public.establishment_invitations set status = 'accepted', accepted_at = now()
  where id = invitation_record.id;
  return invitation_record.establishment_id;
end;
$$;

grant select on public.legal_documents to anon, authenticated;
grant select on public.legal_document_acceptances to authenticated;

revoke all on function public.protect_accepted_legal_document() from public, anon, authenticated;
revoke all on function public.has_current_legal_acceptance(uuid) from public, anon, authenticated;
revoke all on function public._record_current_legal_acceptance(uuid, text, text, text, text, text, uuid, boolean) from public, anon, authenticated;
revoke all on function public.record_settings_legal_acceptance(text, text, text, text, uuid, boolean) from public, anon;
revoke all on function public.onboard_establishment(text, text, text, text, text, text, text, text, text, boolean, text, text, text, boolean) from public, anon;
revoke all on function public.accept_team_invitation(uuid, text, text, text, text, boolean) from public, anon;

grant execute on function public.record_settings_legal_acceptance(text, text, text, text, uuid, boolean) to authenticated;
grant execute on function public.onboard_establishment(text, text, text, text, text, text, text, text, text, boolean, text, text, text, boolean) to authenticated;
grant execute on function public.accept_team_invitation(uuid, text, text, text, text, boolean) to authenticated;
