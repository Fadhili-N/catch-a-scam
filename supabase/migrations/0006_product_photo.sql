-- Catch a Scam — public product photo (follow-up to Phase 4)
-- Run this once in the Supabase SQL Editor, after 0001-0005.
--
-- Deliberately separate from `evidence`: evidence is proof of the scam
-- (chat, payment confirmation) and is NEVER public, because it usually
-- contains the reporter's own personal details even after redaction. A
-- product photo is different in kind — it's a screenshot of the
-- SELLER'S OWN public post, which by its nature carries no reporter
-- personal data, and showing it is exactly what makes the homepage and
-- account pages recognizable at a glance. Keeping these as two separate
-- columns/buckets means a bug can never accidentally make evidence
-- public — there is no path from the private bucket to the public one.

alter table public.reports add column product_photo_path text;

-- Public bucket: unlike `evidence`, objects here are served from a plain
-- public URL with no signed-URL step and no RLS SELECT policy needed —
-- that's what public = true means in Supabase Storage. Only the INSERT
-- side needs a policy, so a stranger can't fill someone else's report
-- folder with unrelated images.
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product photos are uploadable by the report's own reporter"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-photos'
    and exists (
      select 1 from public.reports r
      where r.id::text = (storage.foldername(name))[1]
        and r.reporter_id = auth.uid()
    )
  );

-- set_report_product_photo ---------------------------------------------
-- Uploading the file is covered by the storage policy above, but
-- recording its path on the report row is a plain UPDATE on `reports` —
-- and the only UPDATE policy that table has is "moderators may update
-- report status" (0002_policies.sql). A reporter is not a moderator, so
-- a bare `.update({ product_photo_path })` from the report form would be
-- silently blocked by RLS (matching zero rows, no error — the exact
-- failure mode documented at length in moderate/actions.ts). Loosening
-- the general UPDATE policy instead would let a reporter rewrite other
-- columns of their own row too (status included) via a crafted request,
-- not just this one — Postgres can't easily express "only this column
-- may change" across a USING/WITH CHECK pair on the same table. A
-- narrow security-definer function side-steps the whole problem, the
-- same pattern as find_or_create_account and increment_account_view_count:
-- it does exactly one thing, and nothing it does is reachable any other way.
create function public.set_report_product_photo(report_id_in uuid, path_in text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports
  set product_photo_path = path_in
  where id = report_id_in
    and reporter_id = auth.uid()
    and status = 'pending'; -- can't attach one after a moderator has already ruled on the report
end;
$$;

-- Same two-step revoke as find_or_create_account's migration comment
-- explains in full: CREATE FUNCTION grants EXECUTE to PUBLIC by default,
-- and Supabase separately auto-grants it to anon too — both have to be
-- revoked explicitly, or an anonymous visitor could call this.
revoke execute on function public.set_report_product_photo(uuid, text) from public;
revoke execute on function public.set_report_product_photo(uuid, text) from anon;
grant execute on function public.set_report_product_photo(uuid, text) to authenticated;
