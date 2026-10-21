-- Catch a Scam — photo-match links between evidence images (Phase 6)
-- Run this once in the Supabase SQL Editor, after 0001-0004.
--
-- Written to by the Python image-matching service only (services/
-- image-matching), using its own service-role key — which bypasses RLS
-- entirely by Supabase's design, the same way scripts/seed.mjs does. That
-- is why there is no INSERT policy below: nothing else is meant to write
-- here, and nothing else can.

create table public.photo_matches (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.evidence (id) on delete cascade,
  matched_evidence_id uuid not null references public.evidence (id) on delete cascade,
  hamming_distance integer not null,
  created_at timestamptz not null default now(),
  -- Each pair is stored exactly once, in a canonical (smaller id first)
  -- order, enforced here rather than trusted from the caller — the
  -- service still always writes them that way, but the alternative is a
  -- CHECK that can't be bypassed if that ever changes.
  constraint photo_matches_distinct check (evidence_id <> matched_evidence_id),
  constraint photo_matches_canonical_order check (evidence_id < matched_evidence_id),
  unique (evidence_id, matched_evidence_id)
);

create index photo_matches_evidence_id_idx on public.photo_matches (evidence_id);
create index photo_matches_matched_evidence_id_idx on public.photo_matches (matched_evidence_id);

alter table public.photo_matches enable row level security;

-- Visible once BOTH sides' reports are approved (or to a moderator
-- regardless) — never earlier, so a pending/rejected report's photo
-- relationships can't leak through this side door before a human has
-- reviewed it. Mirrors the identifier-based linking policy's spirit
-- (0001_init.sql's getLinkedAccounts), just for photos instead of
-- till/phone numbers.
create policy "photo matches are visible once both sides are approved"
  on public.photo_matches for select
  using (
    public.is_moderator()
    or (
      exists (
        select 1 from public.evidence e
        join public.reports r on r.id = e.report_id
        where e.id = photo_matches.evidence_id and r.status = 'approved'
      )
      and exists (
        select 1 from public.evidence e
        join public.reports r on r.id = e.report_id
        where e.id = photo_matches.matched_evidence_id and r.status = 'approved'
      )
    )
  );

-- get_photo_linked_accounts -------------------------------------------------
-- The account page needs "which other accounts share a photo with this
-- one", but evidence itself is never publicly selectable (see
-- 0002_policies.sql) — not even to look up which evidence IDs belong to
-- an account, which is what computing that answer would otherwise
-- require. This function does the whole three-way join (evidence ->
-- photo_matches -> evidence -> reports -> accounts) as its own owner,
-- bypassing that restriction internally, but it only ever returns
-- `accounts` rows that already satisfy "public accounts are readable by
-- everyone" on their own (an approved report implies is_public = true) —
-- so nothing comes out of this that a visitor couldn't already see some
-- other way. It is the photo-similarity counterpart to the identifier-
-- based linking the account page already does directly in TypeScript
-- (identifiers are publicly selectable once their report is approved, so
-- that one doesn't need a function like this).
create function public.get_photo_linked_accounts(account_id_in uuid)
returns setof public.accounts
language sql
security definer
set search_path = public
stable
as $$
  select distinct a.*
  from public.evidence e_mine
  join public.reports r_mine
    on r_mine.id = e_mine.report_id
    and r_mine.account_id = account_id_in
    and r_mine.status = 'approved'
  join public.photo_matches pm
    on pm.evidence_id = e_mine.id or pm.matched_evidence_id = e_mine.id
  join public.evidence e_other
    on e_other.id = (case when pm.evidence_id = e_mine.id then pm.matched_evidence_id else pm.evidence_id end)
  join public.reports r_other
    on r_other.id = e_other.report_id
    and r_other.status = 'approved'
    and r_other.account_id <> account_id_in
  join public.accounts a on a.id = r_other.account_id
$$;

-- Deliberately granted to anon as well as authenticated — unlike
-- find_or_create_account, this one is read-only and is part of the public
-- "search before you pay" page, which never requires signing in.
grant execute on function public.get_photo_linked_accounts(uuid) to anon, authenticated;
