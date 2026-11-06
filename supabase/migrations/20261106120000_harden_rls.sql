-- Replace username-based authorization with real ownership and an admin table.
--
-- Before this migration:
--   * commentary update/delete trusted profiles.username, which users could
--     change, so anyone could take over another author's commentary.
--   * commentary insert accepted any commentary_author value.
--   * profiles (including email) were readable with the public anon key.
--
-- Compatible with the previous app code, so apply it BEFORE deploying the app
-- changes. Seed public.admins immediately afterwards (see below); the seed is
-- deliberately not in this public repo.
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = '<admin email>';

begin;

-- Admins -------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Membership has no write policies: manage it from the SQL editor only.
drop policy if exists "Users can see their own admin row" on public.admins;
create policy "Users can see their own admin row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- Profiles -----------------------------------------------------------------

-- Usernames become author identity, so they must be unique and admin-managed.
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- The handle_new_user trigger creates profiles, so users need no insert policy.
create policy "Users can read their own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "Admins can read all profiles" on public.profiles
  for select to authenticated
  using (public.is_admin());

create policy "Admins can update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

-- Commentary ---------------------------------------------------------------

alter table public.commentary
  add column if not exists user_id uuid
    references auth.users (id) on delete set null
    default auth.uid();

-- Rows whose author has no account stay NULL and are admin-only.
update public.commentary c
set user_id = p.id
from public.profiles p
where p.username = c.commentary_author
  and c.user_id is null;

create index if not exists idx_commentary_user_id
  on public.commentary (user_id);

-- Identity comes from the session, never from the submitted row.
create or replace function public.enforce_commentary_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  profile_id uuid;
  profile_username text;
begin
  -- Service role and SQL editor. Anon has no write grant or policy.
  if current_user_id is null then
    return new;
  end if;

  if public.is_admin() then
    -- Admins may post on behalf of others. Link the row to the named author
    -- when they have an account, so that author can still manage it.
    if tg_op = 'INSERT' then
      select id into profile_id
      from public.profiles
      where username = new.commentary_author;

      new.user_id := coalesce(profile_id, current_user_id);
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.commentary_author := old.commentary_author;
    return new;
  end if;

  select username into profile_username
  from public.profiles
  where id = current_user_id;

  if profile_username is null then
    raise exception 'An admin must set your username before you can post commentary.';
  end if;

  new.user_id := current_user_id;
  new.commentary_author := profile_username;
  return new;
end;
$$;

revoke execute on function public.enforce_commentary_identity()
  from public, anon, authenticated;

drop trigger if exists enforce_commentary_identity on public.commentary;
create trigger enforce_commentary_identity
  before insert or update on public.commentary
  for each row
  execute function public.enforce_commentary_identity();

drop policy if exists "Enable insert for authenticated users only" on public.commentary;
drop policy if exists "Users can update their own commentary" on public.commentary;
drop policy if exists "Users can delete their own commentary" on public.commentary;

create policy "Users can insert their own commentary" on public.commentary
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owners and admins can update commentary" on public.commentary
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Owners and admins can delete commentary" on public.commentary
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.commentary from anon, authenticated;
grant select on public.commentary to anon;
grant select, insert, update, delete on public.commentary to authenticated;

-- Commentary requests ------------------------------------------------------

-- Anonymous requests stay allowed, but only as well-formed pending rows.
drop policy if exists "Allow users to insert commentary requests" on public.commentary_requests;
create policy "Anyone can insert pending commentary requests" on public.commentary_requests
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and book ~ '^[A-Z0-9]{3}$'
    and chapter between 1 and 150
    and verse between 1 and 176
  );

revoke all on public.commentary_requests from anon, authenticated;
-- Anon keeps SELECT so reads return no rows (no policy) rather than an error.
grant select, insert on public.commentary_requests to anon;
grant select, insert on public.commentary_requests to authenticated;

-- Chiasms: RLS is already correct, only tighten the grants -----------------

revoke all on public.chiasms, public.chiasm_units from anon, authenticated;
grant select on public.chiasms, public.chiasm_units to anon;
grant select, insert, update, delete
  on public.chiasms, public.chiasm_units to authenticated;

-- Functions flagged by the Supabase security advisor -----------------------

alter function public.update_updated_at_column() set search_path = '';
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

commit;
