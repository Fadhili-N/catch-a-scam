-- Catch a Scam — submit-a-report support (Phase 4)
-- Adds the private evidence storage bucket and its access policies, plus a
-- helper function for the "report a handle that may already exist" case.
-- Run this once in the Supabase SQL Editor, after 0001-0003.

-- evidence storage bucket -------------------------------------------------
-- Private: nothing in this bucket is reachable by a bare URL. Access is
-- only ever through a signed URL issued after the policies below pass.
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Not enabling RLS on storage.objects here: Supabase already turns it on
-- by default for every project, and the table is owned by Supabase's own
-- storage service, so this project's SQL Editor role can't ALTER it anyway
-- (that's the "must be owner of table objects" error if you try).

-- Objects are stored at "<report_id>/<filename>". storage.foldername(name)
-- splits that path, so foldername(name)[1] is the report_id — that's what
-- lets these policies reuse the same ownership check as the `evidence`
-- table's own RLS policies in 0002_policies.sql.
create policy "evidence objects are uploadable by the report's own reporter"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'evidence'
    and exists (
      select 1 from public.reports r
      where r.id::text = (storage.foldername(name))[1]
        and r.reporter_id = auth.uid()
    )
  );

create policy "evidence objects are readable by their uploader and moderators"
  on storage.objects for select
  using (
    bucket_id = 'evidence'
    and (
      public.is_moderator()
      or exists (
        select 1 from public.reports r
        where r.id::text = (storage.foldername(name))[1]
          and r.reporter_id = auth.uid()
      )
    )
  );

-- find_or_create_account ---------------------------------------------------
-- A second report against an already-reported handle is the normal case,
-- not an edge case — and the existing account row may well not be
-- is_public yet (its only report so far could still be pending). The
-- ordinary "authenticated users may register a new handle" INSERT policy
-- from 0002 can't see that row to avoid re-inserting it, and a regular
-- user has no UPDATE rights on accounts to use a plain upsert. This
-- function runs as its owner (security definer) to look past that, doing
-- exactly one thing: return the existing row for (platform, handle), or
-- create it. It never exposes any other privileged operation.
create function public.find_or_create_account(
  platform_in text,
  handle_in text,
  display_name_in text default null
)
returns public.accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  acct public.accounts;
begin
  select * into acct from public.accounts
  where platform = platform_in and handle = handle_in;

  if found then
    return acct;
  end if;

  insert into public.accounts (platform, handle, display_name)
  values (platform_in, handle_in, display_name_in)
  returning * into acct;

  return acct;
end;
$$;

-- Deliberately granted to authenticated only, not anon — registering a
-- handle is part of filing a report, which already requires an account.
--
-- Two separate things grant this function away by default and BOTH must be
-- revoked, confirmed by testing against a live project (see
-- scripts/_tmp-test-report-flow.mjs during Phase 4):
--   1. CREATE FUNCTION grants EXECUTE to PUBLIC (every role) unless revoked.
--   2. Supabase additionally runs ALTER DEFAULT PRIVILEGES on every new
--      project, which grants EXECUTE directly to anon and authenticated on
--      every newly created function — independent of (1), and the reason
--      revoking only from PUBLIC was not sufficient on its own.
revoke execute on function public.find_or_create_account(text, text, text) from public;
revoke execute on function public.find_or_create_account(text, text, text) from anon;
grant execute on function public.find_or_create_account(text, text, text) to authenticated;
