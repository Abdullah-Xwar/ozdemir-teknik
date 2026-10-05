-- Özdemir Teknik Bilgisayar - Gerçek servis talep sistemi
-- Supabase SQL Editor'a tek parça halinde yapıştırıp çalıştır.

create extension if not exists pgcrypto;

create sequence if not exists public.service_request_number_seq;

create table if not exists public.service_requests (
    id uuid primary key default gen_random_uuid(),
    tracking_code text unique,
    customer_name text not null check (char_length(customer_name) between 2 and 100),
    customer_phone text,
    device_type text not null,
    device_model text not null,
    problem text not null,
    extra_info text,
    status text not null default 'Talep Alındı',
    required_action text,
    technician_note text,
    delivery_date date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.make_service_tracking_code()
returns trigger
language plpgsql
as $$
begin
    if new.tracking_code is null or btrim(new.tracking_code) = '' then
        new.tracking_code := 'OT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.service_request_number_seq')::text, 4, '0');
    end if;
    return new;
end;
$$;

drop trigger if exists trg_service_tracking_code on public.service_requests;
create trigger trg_service_tracking_code
before insert on public.service_requests
for each row execute function public.make_service_tracking_code();

create or replace function public.touch_service_request_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists trg_service_updated_at on public.service_requests;
create trigger trg_service_updated_at
before update on public.service_requests
for each row execute function public.touch_service_request_updated_at();

alter table public.service_requests enable row level security;

drop policy if exists "Public can read service requests" on public.service_requests;
create policy "Public can read service requests"
on public.service_requests
for select
to anon, authenticated
using (true);

drop policy if exists "Public can create service requests" on public.service_requests;
create policy "Public can create service requests"
on public.service_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can update service requests" on public.service_requests;
create policy "Authenticated admins can update service requests"
on public.service_requests
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete service requests" on public.service_requests;
create policy "Authenticated admins can delete service requests"
on public.service_requests
for delete
to authenticated
using (true);

-- Canlı güncelleme için Realtime yayınına tabloyu ekle.
do $$
begin
    alter publication supabase_realtime add table public.service_requests;
exception when duplicate_object then
    null;
end $$;

-- ÖNEMLİ:
-- Supabase Dashboard > Authentication > Users bölümünden senin yönetici hesabını oluştur.
-- Bu kullanıcıyla HTML içindeki Yönetim Paneli'ne giriş yapılacaktır.
