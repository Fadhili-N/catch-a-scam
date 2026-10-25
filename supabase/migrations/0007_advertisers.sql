-- Catch a Scam — categories and sponsored "legit sellers" (monetisation)
-- Run this once in the Supabase SQL Editor, after 0001-0006.
--
-- The idea: someone lands on a scam account's page looking for shoes —
-- that's the moment to show a legit shoe seller who paid for the
-- placement, not a generic banner nobody reads. That needs reports to
-- carry a simple category, and a table of paying advertisers matched to
-- it. There is no self-serve signup or payment flow yet — a moderator
-- adds an advertiser by hand after being paid directly (M-Pesa, bank
-- transfer, whatever), which is why there's no public INSERT policy at
-- all on `advertisers` below, same reasoning as every other
-- moderator-only table in this schema.

-- category on reports -------------------------------------------------
alter table public.reports
  add column category text not null default 'other'
  check (category in ('shoes', 'clothing', 'electronics', 'beauty', 'accessories', 'other'));

-- advertisers ------------------------------------------------------------
create table public.advertisers (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  category text not null check (category in ('shoes', 'clothing', 'electronics', 'beauty', 'accessories', 'other')),
  description text not null,
  contact_url text not null, -- their real Instagram/TikTok/website — where the click goes
  logo_path text, -- public bucket, like product-photos; null is fine, the card just skips the image
  is_active boolean not null default true,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);

create index advertisers_category_idx on public.advertisers (category);

alter table public.advertisers enable row level security;

-- Readable by everyone, logged in or not — an ad only a signed-in user
-- could see would defeat the point. Still gated to "currently running
-- and paid for": a moderator can set is_active = false or an end date
-- without deleting the row, keeping its history for their own records.
create policy "active advertisers within their date range are public"
  on public.advertisers for select
  using (
    is_active
    and (starts_at is null or starts_at <= current_date)
    and (ends_at is null or ends_at >= current_date)
  );

create policy "moderators can see every advertiser regardless of status"
  on public.advertisers for select
  using (public.is_moderator());

create policy "only moderators manage advertisers"
  on public.advertisers for all
  using (public.is_moderator())
  with check (public.is_moderator());

-- advertiser-logos storage bucket -----------------------------------------
-- Public, like product-photos — a business's own logo, nothing sensitive.
insert into storage.buckets (id, name, public)
values ('advertiser-logos', 'advertiser-logos', true)
on conflict (id) do nothing;

create policy "only moderators upload advertiser logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'advertiser-logos' and public.is_moderator());
