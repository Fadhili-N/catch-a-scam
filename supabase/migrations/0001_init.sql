-- Catch a Scam — initial schema (Phase 1)
-- Six tables: profiles, accounts, reports, identifiers, evidence, comments.
-- Run this once in the Supabase SQL Editor, then run 0002_policies.sql.

-- Extensions -----------------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid()
create extension if not exists pg_trgm;   -- fuzzy handle search, used from Phase 2 onward

-- profiles ---------------------------------------------------------------
-- One row per signed-up user, extending auth.users (which we never modify
-- directly) with fields our app needs, chiefly the moderation role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

-- A profile row is created automatically whenever someone signs up — the
-- client never inserts into this table directly, which keeps "role" out of
-- reach of client code entirely.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A user may later change their own display_name (handled by the update RLS
-- policy in 0002), but must never be able to grant themselves a role. This
-- trigger silently discards any change to role that didn't come from the
-- server's service-role connection (e.g. an admin action).
create function public.prevent_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- accounts -----------------------------------------------------------------
-- A trading handle being reported on, e.g. @shoeplug.ke on TikTok.
-- Deliberately never a person's legal name (README principle 2).
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('tiktok', 'instagram', 'whatsapp', 'facebook', 'other')),
  handle text not null,
  display_name text,
  -- Flips to true only when a moderator approves the account's first report.
  -- An explicit flag rather than a computed check — cheaper to query, and it
  -- lets a moderator unpublish an account later without deleting its history.
  is_public boolean not null default false,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (platform, handle)
);

-- Powers fuzzy handle search (Phase 2): "shoeplugke" should still find
-- "shoe.plug.ke", since scam accounts vary punctuation constantly.
create index accounts_handle_trgm_idx on public.accounts using gin (handle gin_trgm_ops);

-- reports --------------------------------------------------------------
-- One victim's account of a single transaction. The core content unit.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  amount_lost numeric(12, 2),
  currency text not null default 'KES',
  incident_date date,
  promised_item text,
  narrative text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_id uuid references auth.users (id) on delete set null,
  moderator_note text,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_account_id_idx on public.reports (account_id);
create index reports_status_idx on public.reports (status);
create index reports_reporter_id_idx on public.reports (reporter_id);

-- identifiers ------------------------------------------------------------
-- The payment/contact details cited in a report: till, paybill, phone,
-- WhatsApp number, or the registered M-Pesa name on the till. This is the
-- table that links a rebranded scam page back to its previous identity —
-- the core differentiator of the whole product.
create table public.identifiers (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  type text not null check (type in ('phone', 'whatsapp', 'till', 'paybill', 'bank_account', 'mpesa_name')),
  raw_value text not null,       -- exactly as the reporter typed it
  normalized_value text not null, -- canonical form, e.g. phone -> +254712345678
  created_at timestamptz not null default now()
);

-- The index that makes cross-account linking fast: "does this number show
-- up under any other handle?" is a lookup on this column.
create index identifiers_normalized_value_idx on public.identifiers (normalized_value);
create index identifiers_report_id_idx on public.identifiers (report_id);

-- evidence -----------------------------------------------------------------
-- Screenshots backing a report. storage_path points into a PRIVATE Supabase
-- Storage bucket — evidence is never served from a public URL, only via a
-- signed URL issued after an access check. perceptual_hash starts empty and
-- is filled in later by the Python image-matching service (Phase 6); adding
-- the column now avoids a schema change later.
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null,
  reporter_confirmed_redacted boolean not null default false,
  perceptual_hash text,
  created_at timestamptz not null default now()
);

create index evidence_report_id_idx on public.evidence (report_id);

-- comments -------------------------------------------------------------
-- Discussion on an account's page. Unlike reports, a comment is visible as
-- soon as it's posted; moderators can remove one after the fact. Reports
-- carry legal weight as allegations and always wait for a human — comments
-- are just discussion, and queuing all of them would bury moderators for
-- little safety benefit.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'removed')),
  created_at timestamptz not null default now()
);

create index comments_account_id_idx on public.comments (account_id);
