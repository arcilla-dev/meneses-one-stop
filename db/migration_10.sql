/*
  Admin (Announcements) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER:
    - the LSC SQL (it creates public.announcements and public.announcement_reads;
      step 1 below creates the table too if you skipped that)
    - supabase/admin-registrar.sql (is_staff(), "Staff read profiles" policy)

  Result:
    - every signed-in user (students and admins) can READ announcements
    - only staff (profiles.role = 'admin' or 'superadmin') can post, edit or delete
    - staff can edit an announcement for 1 HOUR after it was posted (enforced here, not just in the UI)
    - the database decides created_at, created_by and office, whatever the browser sends
*/

/* 0. make sure the staff check exists (harmless if it already does) */
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

/* 1. the table (already exists if you ran the LSC SQL, so this is a no-op then) */
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  pinned     boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

/* 2. columns the Announcements pages need.
      Existing announcements get type 'general' and office 'Administration'. */
alter table public.announcements add column if not exists announcement_type text not null default 'general';
alter table public.announcements add column if not exists office            text not null default 'Administration';
alter table public.announcements add column if not exists updated_at        timestamptz;

/* which office an admin posts for (e.g. Registrar's Office). Set it per admin, see the bottom of this file. */
alter table public.profiles add column if not exists office text;

/* 3. validation. Keep the type list in sync with TYPE_OPTIONS in the admin page.
      Lengths match the maxLength of the inputs (120 / 1000).
      NOT VALID = old rows are not re-checked, every new or edited row is. */
alter table public.announcements drop constraint if exists announcements_type_check;
alter table public.announcements add constraint announcements_type_check
  check (announcement_type in ('general','enrollment','infirmary','scholarship','printing'));

alter table public.announcements drop constraint if exists announcements_title_len;
alter table public.announcements add constraint announcements_title_len
  check (char_length(btrim(title)) between 1 and 120) not valid;

alter table public.announcements drop constraint if exists announcements_message_len;
alter table public.announcements add constraint announcements_message_len
  check (char_length(btrim(message)) between 1 and 1000) not valid;

create index if not exists announcements_created_idx on public.announcements (created_at desc);

/* 4. the server decides who posted it, when, and for which office */
create or replace function public.announcements_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare my_office text;
begin
  select nullif(btrim(office), '') into my_office from public.profiles where id = auth.uid();

  new.created_by := auth.uid();
  new.created_at := now();
  new.updated_at := null;
  new.title      := btrim(new.title);
  new.message    := btrim(new.message);
  -- the admin's own office wins; a value typed in the SQL Editor is only used if the profile has none
  new.office     := coalesce(my_office, nullif(btrim(new.office), ''), 'Administration');
  return new;
end $$;

drop trigger if exists trg_announcements_before_insert on public.announcements;
create trigger trg_announcements_before_insert before insert on public.announcements
  for each row execute function public.announcements_before_insert();

create or replace function public.announcements_before_update()
returns trigger language plpgsql set search_path = public as $$
begin
  new.title      := btrim(new.title);
  new.message    := btrim(new.message);
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_announcements_before_update on public.announcements;
create trigger trg_announcements_before_update before update on public.announcements
  for each row execute function public.announcements_before_update();

/* 5. grants. Column-level on purpose: the browser can never write created_at, created_by or office,
      so nobody can reset created_at to stretch the 1-hour edit window. */
alter table public.announcements enable row level security;

revoke insert, update on public.announcements from authenticated;
grant select, delete on public.announcements to authenticated;
grant insert (id, title, message, announcement_type, pinned) on public.announcements to authenticated;
grant update (title, message, announcement_type, pinned)     on public.announcements to authenticated;

/* 6. policies */
drop policy if exists "lsc ann read"                              on public.announcements;
drop policy if exists "lsc ann staff write"                       on public.announcements;  -- was FOR ALL, it would bypass the 1-hour rule
drop policy if exists "Signed-in users read announcements"        on public.announcements;
drop policy if exists "Staff create announcements"                on public.announcements;
drop policy if exists "Staff edit announcements within 1 hour"    on public.announcements;
drop policy if exists "Staff delete announcements"                on public.announcements;

create policy "Signed-in users read announcements" on public.announcements
  for select to authenticated using (true);

create policy "Staff create announcements" on public.announcements
  for insert to authenticated with check (public.is_staff());

-- USING decides which rows can be edited: only staff, only within an hour of created_at.
-- To change the window, change the interval here AND EDIT_WINDOW_MS in lib/announcementsApi.ts.
create policy "Staff edit announcements within 1 hour" on public.announcements
  for update to authenticated
  using (public.is_staff() and created_at > now() - interval '1 hour')
  with check (public.is_staff());

create policy "Staff delete announcements" on public.announcements
  for delete to authenticated using (public.is_staff());

/* 7. set the office of each admin (run once per admin; the page shows it as "Posting as ...") */
-- update public.profiles set office = 'Registrar''s Office'
--   where id = (select id from auth.users where email = 'registrar.admin@example.com');
-- update public.profiles set office = 'Infirmary'
--   where id = (select id from auth.users where email = 'infirmary.admin@example.com');

/*
  SECURITY: please review before going live.
  The profile SQL earlier in this file runs
      grant update on public.profiles to authenticated;
      create policy "Users can update their own profile" on profiles for update
        using (auth.uid() = id) with check (auth.uid() = id);
  That lets every signed-in user update EVERY column of their own profiles row, including `role`
  (and `office`). Unless a trigger elsewhere protects them, a student can run
      supabase.from('profiles').update({ role: 'superadmin' }).eq('id', myId)
  and becomes staff: is_staff() then lets them post announcements and read every request.
  Restrict the columns a user may update. Replace the column list with exactly what your
  profile page saves (check it first, or saving the profile will fail with "permission denied"):
*/
  revoke update on public.profiles from authenticated;
  grant  update (full_name, email, avatar_url) on public.profiles to authenticated;


/*
  Handling announcements without the UI (works in the SQL Editor; created_at is always set to now()):
  insert into public.announcements (title, message, announcement_type, office)
  values ('Enrollment opens Monday', 'Check your college schedule.', 'enrollment', 'Registrar''s Office');

  delete from public.announcements where id = '<announcement id>';
*/
