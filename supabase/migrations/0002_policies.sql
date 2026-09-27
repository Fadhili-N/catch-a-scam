-- Catch a Scam — Row Level Security policies (Phase 1)
-- Enforces "reading is free and anonymous; posting requires an account"
-- inside the database itself, not in application code. Run after 0001_init.sql.

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.reports enable row level security;
alter table public.identifiers enable row level security;
alter table public.evidence enable row level security;
alter table public.comments enable row level security;

-- Helper used throughout: is the current user a moderator or admin?
create function public.is_moderator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

-- profiles ---------------------------------------------------------------
-- No INSERT policy: rows are created only by the on_auth_user_created
-- trigger (0001), which runs as the table owner and bypasses RLS. Client
-- code never inserts into this table.

create policy "profiles readable by their owner and moderators"
  on public.profiles for select
  using (auth.uid() = id or public.is_moderator());

create policy "a user may update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
  -- Role escalation is blocked separately by the prevent_role_escalation
  -- trigger in 0001, not by this policy.

-- accounts -----------------------------------------------------------------
create policy "public accounts are readable by everyone"
  on public.accounts for select
  using (is_public = true or public.is_moderator());

create policy "authenticated users may register a new handle"
  on public.accounts for insert
  to authenticated
  with check (true);
  -- Newly inserted accounts default is_public = false, so registering one
  -- does not make it visible — only an approved report does that.

create policy "moderators may update accounts"
  on public.accounts for update
  using (public.is_moderator());

-- reports --------------------------------------------------------------
create policy "approved reports are readable by everyone; reporters and moderators see all statuses"
  on public.reports for select
  using (status = 'approved' or reporter_id = auth.uid() or public.is_moderator());

create policy "authenticated users may file a report as themselves"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "moderators may update report status"
  on public.reports for update
  using (public.is_moderator());

-- identifiers ------------------------------------------------------------
-- Visibility always follows the parent report's visibility.
create policy "identifiers are readable when their report is readable"
  on public.identifiers for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = identifiers.report_id
        and (r.status = 'approved' or r.reporter_id = auth.uid() or public.is_moderator())
    )
  );

create policy "a user may attach identifiers to their own report"
  on public.identifiers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reports r
      where r.id = identifiers.report_id and r.reporter_id = auth.uid()
    )
  );

-- evidence -----------------------------------------------------------------
-- Never publicly readable, regardless of report status — evidence contains
-- the reporter's own personal details and is only ever shown as a signed
-- URL after a server-side access check.
create policy "evidence is readable only by its uploader and moderators"
  on public.evidence for select
  using (
    public.is_moderator()
    or exists (
      select 1 from public.reports r
      where r.id = evidence.report_id and r.reporter_id = auth.uid()
    )
  );

create policy "a user may attach evidence to their own report"
  on public.evidence for insert
  to authenticated
  with check (
    exists (
      select 1 from public.reports r
      where r.id = evidence.report_id and r.reporter_id = auth.uid()
    )
  );

-- comments -------------------------------------------------------------
create policy "visible comments are readable by everyone"
  on public.comments for select
  using (status = 'visible' or public.is_moderator());

create policy "authenticated users may comment as themselves"
  on public.comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "moderators may remove comments"
  on public.comments for update
  using (public.is_moderator());
