create or replace function public.normalize_phone(phone_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  with normalized as (
    select regexp_replace(coalesce(phone_input, ''), '[^0-9]', '', 'g') as digits
  )
  select case
    when length(digits) in (12, 13) and left(digits, 2) = '55' then substr(digits, 3)
    else digits
  end
  from normalized;
$$;

update public.customers
set
  full_name = trim(full_name),
  phone = public.normalize_phone(phone),
  email = nullif(lower(trim(email)), '')
where length(public.normalize_phone(phone)) between 8 and 15;

create unique index if not exists customers_establishment_phone_unique
  on public.customers (establishment_id, phone)
  where length(phone) between 8 and 15;

create or replace function public.normalize_customer_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.full_name := trim(new.full_name);
  new.phone := public.normalize_phone(new.phone);
  new.email := nullif(lower(trim(new.email)), '');

  if length(new.full_name) < 2 or length(new.phone) not between 8 and 15 then
    raise exception 'Invalid customer identity';
  end if;

  return new;
end;
$$;

drop trigger if exists customers_normalize_identity on public.customers;
create trigger customers_normalize_identity
  before insert or update of full_name, phone, email on public.customers
  for each row execute function public.normalize_customer_identity();

create or replace function public.validate_appointment_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  configured_price integer;
begin
  if new.starts_at <= now() then
    raise exception 'Appointment must start in the future';
  end if;

  select professional_service.price_cents
  into configured_price
  from public.professionals as professional
  join public.professional_services as professional_service
    on professional_service.professional_id = professional.id
  join public.services as service
    on service.id = professional_service.service_id
  join public.customers as customer
    on customer.id = new.customer_id
  where professional.id = new.professional_id
    and professional.establishment_id = new.establishment_id
    and professional_service.id = new.professional_service_id
    and service.establishment_id = new.establishment_id
    and customer.establishment_id = new.establishment_id;

  if configured_price is null then
    raise exception 'Appointment references are outside the establishment scope';
  end if;

  new.price_cents := configured_price;
  if tg_op = 'INSERT' and (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate_integrity on public.appointments;
create trigger appointments_validate_integrity
  before insert or update of establishment_id, professional_id, professional_service_id,
    customer_id, starts_at, ends_at on public.appointments
  for each row execute function public.validate_appointment_integrity();

revoke all on function public.normalize_phone(text) from public, anon, authenticated;
revoke all on function public.normalize_customer_identity() from public, anon, authenticated;
revoke all on function public.validate_appointment_integrity() from public, anon, authenticated;
