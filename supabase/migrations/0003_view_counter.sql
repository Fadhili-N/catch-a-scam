-- Catch a Scam — anonymous view counter (Phase 2)
--
-- Anonymous visitors have no general UPDATE rights on accounts (see
-- 0002_policies.sql) — only moderators do. This function is a narrow,
-- deliberate exception: it does exactly one thing, incrementing a single
-- counter, and nothing else. Granting EXECUTE on it to anon is safe even
-- though anon cannot otherwise write to this table at all.

create function public.increment_account_view_count(account_id_in uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.accounts
  set view_count = view_count + 1
  where id = account_id_in;
$$;

grant execute on function public.increment_account_view_count(uuid) to anon, authenticated;
