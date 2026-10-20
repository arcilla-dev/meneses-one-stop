/* 
  This script is used solely for documentation purposes
  Always run your sql script in supabase sql editor
 */

/* This resolves student number login bug for unauthenticated users */

/* 
  This creates a security risk that allows unauthenticated users to brute force student numbers
  until they find one

  Since it's a student project, it might be unnecessary to fix it  
*/

create or replace function public.get_login_email(p_student_number text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.email
  from public.student_profiles sp
  join public.profiles p on p.id = sp.id
  where sp.student_number = p_student_number
  limit 1;
$$;

revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;

//profile changes//
alter table profiles add column avatar_url text;
alter table student_profiles add column gender text, add column age integer;

create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

grant update on public.profiles to authenticated;

create policy "Users can update their own profile"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

grant update on public.student_profiles to authenticated;

create policy "Students can update their own student profile"
on student_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

alter table profiles add column if not exists full_name text;

update profiles set full_name = 'Your Superadmin Name' where role = 'superadmin';

/*
  SUPABASE SETUP (run once when you're ready to switch off the mock data):

  create table documents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    category text not null check (category in ('academic','generated','submitted')),
    doc_type text not null,            -- e.g. 'cor', 'grades', 'forms' (keys in CATEGORIES below)
    file_path text not null,           -- storage path, convention: '<user_id>/<file name>'
    file_size bigint,
    created_at timestamptz not null default now()
  );
  alter table documents enable row level security;
  grant select on public.documents to authenticated;
  create policy "Users read own documents" on documents for select using (auth.uid() = user_id);

  -- Storage: create a PRIVATE bucket named "documents", then:
  create policy "Users read own document files" on storage.objects for select
    using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
*/

/* Modals: document requests + add/remove subject */

create table public.registrar_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  request_type    text not null,                 -- report_of_grades, certificate_of_registration, good_moral_certificate, other
  details         jsonb not null default '{}',   -- academic_year, semester, purpose, copies, ...
  attachment_path text,                          -- path in the request-attachments bucket
  status          text not null default 'pending' check (status in ('pending','processing','ready','rejected')),
  created_at      timestamptz not null default now()
);

create table public.subject_changes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('add','remove')),
  subject_code  text not null,
  subject_title text not null,
  reason        text not null,
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at    timestamptz not null default now()
);

alter table public.registrar_requests enable row level security;
alter table public.subject_changes   enable row level security;

grant select, insert on public.registrar_requests to authenticated;
grant select, insert on public.subject_changes   to authenticated;

create policy "Users read own requests"   on public.registrar_requests for select using (auth.uid() = user_id);
create policy "Users create own requests" on public.registrar_requests for insert with check (auth.uid() = user_id);

create policy "Users read own subject changes"   on public.subject_changes for select using (auth.uid() = user_id);
create policy "Users create own subject changes" on public.subject_changes for insert with check (auth.uid() = user_id);

/* Storage: create a PRIVATE bucket named "request-attachments" (Dashboard > Storage > New bucket), then: */
create policy "Users upload own request files" on storage.objects for insert to authenticated
  with check (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own request files" on storage.objects for select to authenticated
  using (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

  /* ---- policies for tables you already created ---- */
drop policy if exists "Users read own requests"   on public.registrar_requests;
drop policy if exists "Users create own requests" on public.registrar_requests;
create policy "Users read own requests" on public.registrar_requests
  for select using (auth.uid() = user_id);
create policy "Users create own requests" on public.registrar_requests
  for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users read own subject changes"   on public.subject_changes;
drop policy if exists "Users create own subject changes" on public.subject_changes;
create policy "Users read own subject changes" on public.subject_changes
  for select using (auth.uid() = user_id);
create policy "Users create own subject changes" on public.subject_changes
  for insert with check (auth.uid() = user_id and status = 'pending');

create unique index if not exists one_pending_change_per_subject
  on public.subject_changes (user_id, subject_code) where status = 'pending';

drop policy if exists "Users upload own request files" on storage.objects;
drop policy if exists "Users read own request files"   on storage.objects;
create policy "Users upload own request files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users read own request files" on storage.objects
  for select to authenticated
  using (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

/* ---- subjects catalog + the student's enrolled subjects ---- */
create table if not exists public.subjects (
  code  text primary key,
  title text not null,
  units integer not null default 3,
  day   text not null,
  time  text not null
);
create table if not exists public.student_subjects (
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject_code text not null references public.subjects(code),
  status       text not null default 'enrolled',
  primary key (user_id, subject_code)
);
alter table public.subjects enable row level security;
alter table public.student_subjects enable row level security;
grant select on public.subjects, public.student_subjects to authenticated;

drop policy if exists "Anyone signed in reads subjects" on public.subjects;
drop policy if exists "Users read own subjects"         on public.student_subjects;
create policy "Anyone signed in reads subjects" on public.subjects
  for select to authenticated using (true);
create policy "Users read own subjects" on public.student_subjects
  for select using (auth.uid() = user_id);

/* ---- notifications ---- */
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
grant select, update, delete on public.notifications to authenticated;

drop policy if exists "Users read own notifications"   on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

/* ---- notifications are created by the database, not the browser ---- */
create or replace function public.notify_on_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare label text; msg text;
begin
  if TG_TABLE_NAME = 'registrar_requests' then
    label := initcap(replace(new.request_type, '_', ' '));
  else
    label := initcap(new.kind) || ' subject ' || new.subject_code;
  end if;

  if TG_OP = 'INSERT' then
    msg := label || ' request submitted.';
  elsif new.status is distinct from old.status then
    msg := label || ' request is now ' || new.status || '.';
  else
    return new;
  end if;

  insert into public.notifications (user_id, message) values (new.user_id, msg);
  return new;
end $$;

drop trigger if exists trg_notify_registrar_requests on public.registrar_requests;
create trigger trg_notify_registrar_requests
  after insert or update on public.registrar_requests
  for each row execute function public.notify_on_request();

drop trigger if exists trg_notify_subject_changes on public.subject_changes;
create trigger trg_notify_subject_changes
  after insert or update on public.subject_changes
  for each row execute function public.notify_on_request();

  /*
  insert into public.subjects (code, title, units, day, time) values
  ('CPE 402', 'Computer Architecture and Organization', 3, 'Thu', '11:00 AM - 8:00 PM'),
  ('CPE 310', 'Methods of Research',                     3, 'Thu', '11:00 AM - 8:00 PM'),
  ('CPE 404', 'CPE Practice and Design 1',               1, 'Wed', '2:00 PM - 5:00 PM'),
  ('CPE 405', 'Embedded Systems',                        3, 'Fri', '8:00 AM - 11:00 AM');

insert into public.student_subjects (user_id, subject_code)
select id, code
from auth.users, public.subjects
where email = 'YOUR_EMAIL_HERE'
  and code in ('CPE 402', 'CPE 404');*/

  /* notifications are shared by Registrar and Infirmary, so tag which one each belongs to */
alter table public.notifications
  add column if not exists module text not null default 'registrar',
  add column if not exists type   text;

/* appointments */
create extension if not exists btree_gist;

create table if not exists public.appointments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service    text not null,
  date       date not null,
  time_start time not null,
  time_end   time not null,
  remarks    text,
  status     text not null default 'pending'
             check (status in ('pending','approved','rejected','cancelled','completed')),
  created_at timestamptz not null default now(),
  constraint appt_time_order check (time_end > time_start),
  -- a student can't have two active appointments that overlap
  constraint appt_no_overlap exclude using gist (
    user_id with =,
    tsrange(date + time_start, date + time_end) with &&
  ) where (status in ('pending','approved'))
);

alter table public.appointments enable row level security;
grant select, insert on public.appointments to authenticated;

drop policy if exists "Users read own appointments"   on public.appointments;
drop policy if exists "Users create own appointments" on public.appointments;
create policy "Users read own appointments" on public.appointments
  for select using (auth.uid() = user_id);
create policy "Users create own appointments" on public.appointments
  for insert with check (auth.uid() = user_id and status = 'pending');

/* students can't update rows directly, only cancel their own through this function */
create or replace function public.cancel_appointment(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.appointments set status = 'cancelled'
  where id = p_id and user_id = auth.uid() and status in ('pending','approved');
  if not found then
    raise exception 'This appointment can''t be cancelled.';
  end if;
end $$;
revoke all on function public.cancel_appointment(uuid) from public;
grant execute on function public.cancel_appointment(uuid) to authenticated;

/* notifications created by the database */
create or replace function public.notify_on_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare what text; msg text; kind text := 'appointment';
begin
  what := new.service || ' appointment on ' || to_char(new.date, 'Mon DD, YYYY');

  if TG_OP = 'INSERT' then
    msg := 'Your ' || what || ' has been submitted.';
    kind := 'schedule-request';
  elsif new.status is distinct from old.status then
    msg := case new.status
      when 'approved'  then 'Your ' || what || ' has been approved.'
      when 'rejected'  then 'Your ' || what || ' was rejected. Reason: '
                            || coalesce(nullif(new.remarks, ''), 'Please contact the clinic for more information.')
      when 'cancelled' then 'You cancelled your ' || what || '.'
      when 'completed' then 'Your ' || what || ' is marked as completed.'
      else 'Your ' || what || ' is now ' || new.status || '.'
    end;
  else
    return new;
  end if;

  insert into public.notifications (user_id, module, type, message)
  values (new.user_id, 'infirmary', kind, msg);
  return new;
end $$;

drop trigger if exists trg_notify_appointments on public.appointments;
create trigger trg_notify_appointments
  after insert or update on public.appointments
  for each row execute function public.notify_on_appointment();

  -- =====================================================================
-- LSC (Local Student Council) — Supabase setup, matched to lib/lscApi.ts
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- Needs: public.profiles(id, role) and the shared public.notifications
-- table (user_id, message, is_read, created_at) from Registrar/Infirmary.
-- =====================================================================

/* ---------------------------------------------------------------------
   OPTIONAL CLEAN-UP: only if you ran my EARLIER lsc-supabase.sql
   (it used student_id and capitalized statuses). Uncomment, run once.
   It deletes LSC test data.

drop table if exists public.announcement_reads cascade;
drop table if exists public.announcements cascade;
drop table if exists public.print_requests cascade;
delete from public.notifications where module = 'lsc';
drop policy if exists "lsc files insert own" on storage.objects;
drop policy if exists "lsc files read"       on storage.objects;
drop policy if exists "lsc files delete own" on storage.objects;
--------------------------------------------------------------------- */

-- ---------- notifications: shared by Registrar, Infirmary and LSC ----------
alter table public.notifications
  add column if not exists module text not null default 'registrar',
  add column if not exists type   text,
  add column if not exists title  text;      -- lscApi.ts selects it

-- ---------- helper: admin/superadmin check ----------
create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

-- ---------- rates (replaces PRINT_RATES in lscData.ts) ----------
-- PLACEHOLDERS. paper_size / color must be EXACTLY what String(draft.paperSize)
-- and String(draft.color) send from your form (see lscData.ts).
create table if not exists public.lsc_rates (
  paper_size     text not null,
  color          text not null,
  price_per_page numeric(8,2) not null check (price_per_page >= 0),
  primary key (paper_size, color)
);
insert into public.lsc_rates (paper_size, color, price_per_page) values
  ('Short','Black & White',2), ('Short','Colored',5),
  ('A4','Black & White',2),    ('A4','Colored',5),
  ('Long','Black & White',3),  ('Long','Colored',6)
on conflict do nothing;

-- ---------- request number counter: LSC-YYYY-00001 ----------
create table if not exists public.lsc_counters (
  year int primary key,
  last int not null default 0
);

-- ---------- print_requests ----------
-- Statuses are lowercase to match STATUS_FROM_DB in lscApi.ts.
create table if not exists public.print_requests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  request_number     text unique,
  file_paths         text[] not null,
  file_names         text[] not null,
  paper_size         text not null,
  color              text not null,
  layout             text not null,
  pages              int  not null check (pages between 1 and 100),
  additional_request text,
  total_bill         numeric(8,2) not null default 0,
  status             text not null default 'pending'
    check (status in ('pending','printing','ready','claimed','cancelled')),
  created_at         timestamptz not null default now(),
  claimed_at         timestamptz,
  constraint pr_files_count check (cardinality(file_paths) between 1 and 5),
  constraint pr_names_match check (cardinality(file_names) = cardinality(file_paths))
);
create index if not exists print_requests_user_idx
  on public.print_requests (user_id, created_at desc);

-- BEFORE INSERT: never trust the client for owner, number, status, bill.
create or replace function public.lsc_before_insert_request()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  yr   int := extract(year from now())::int;
  n    int;
  rate numeric;
begin
  select price_per_page into rate from public.lsc_rates
   where paper_size = new.paper_size and color = new.color;
  if rate is null then
    raise exception 'No LSC rate for % / %', new.paper_size, new.color;
  end if;

  insert into public.lsc_counters (year, last) values (yr, 1)
  on conflict (year) do update set last = public.lsc_counters.last + 1
  returning last into n;

  new.user_id        := auth.uid();
  new.request_number := 'LSC-' || yr || '-' || lpad(n::text, 5, '0');
  new.status         := 'pending';
  new.total_bill     := rate * new.pages;
  new.created_at     := now();
  new.claimed_at     := null;
  return new;
end $$;

drop trigger if exists lsc_before_insert_request on public.print_requests;
create trigger lsc_before_insert_request
before insert on public.print_requests
for each row execute function public.lsc_before_insert_request();

-- BEFORE UPDATE: stamp claimed_at.
create or replace function public.lsc_before_update_request()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'claimed' and old.status <> 'claimed' then
    new.claimed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists lsc_before_update_request on public.print_requests;
create trigger lsc_before_update_request
before update on public.print_requests
for each row execute function public.lsc_before_update_request();

-- Students cannot UPDATE rows; they cancel through this function only.
create or replace function public.cancel_print_request(p_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.print_requests set status = 'cancelled'
  where id = p_id and user_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Only pending requests can be cancelled.';
  end if;
end $$;
revoke all on function public.cancel_print_request(uuid) from public;
grant execute on function public.cancel_print_request(uuid) to authenticated;

-- ---------- notifications created by the database ----------
create or replace function public.lsc_notify_request()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare ttl text; msg text;
begin
  if tg_op = 'INSERT' then
    ttl := 'Print request submitted';
    msg := 'Your print request ' || new.request_number || ' was submitted.';
  elsif new.status is distinct from old.status then
    case new.status
      when 'printing'  then
        ttl := 'Print request is printing';
        msg := 'Your print request ' || new.request_number || ' is now being printed.';
      when 'ready'     then
        ttl := 'Print request ready for claiming';
        msg := 'Your print request ' || new.request_number || ' is ready for claiming.';
      when 'claimed'   then
        ttl := 'Print request claimed';
        msg := 'Your print request ' || new.request_number || ' was marked as claimed.';
      when 'cancelled' then
        ttl := 'Print request cancelled';
        msg := 'You cancelled your print request ' || new.request_number || '.';
      else
        return new;
    end case;
  else
    return new;
  end if;

  insert into public.notifications (user_id, module, type, title, message)
  values (new.user_id, 'lsc', 'print-request', ttl, msg);
  return new;
end $$;

drop trigger if exists lsc_notify_insert on public.print_requests;
create trigger lsc_notify_insert after insert on public.print_requests
for each row execute function public.lsc_notify_request();

drop trigger if exists lsc_notify_update on public.print_requests;
create trigger lsc_notify_update after update of status on public.print_requests
for each row execute function public.lsc_notify_request();

-- ---------- announcements + read receipts ----------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text not null,
  pinned     boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- ---------- grants (GRANT and RLS are both required) ----------
grant select on public.lsc_rates to authenticated;
grant select on public.print_requests to authenticated;
-- Students may only send these columns; triggers set the rest.
grant insert (id, file_paths, file_names, paper_size, color, layout, pages, additional_request)
  on public.print_requests to authenticated;
grant update (status) on public.print_requests to authenticated;   -- staff only via RLS
grant select, insert, update, delete on public.announcements to authenticated; -- writes staff only via RLS
grant select, insert on public.announcement_reads to authenticated;
grant select, update, delete on public.notifications to authenticated;

-- ---------- RLS ----------
alter table public.lsc_rates          enable row level security;
alter table public.print_requests     enable row level security;
alter table public.announcements      enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.notifications      enable row level security;

drop policy if exists "lsc rates read"        on public.lsc_rates;
drop policy if exists "lsc pr select"         on public.print_requests;
drop policy if exists "lsc pr insert own"     on public.print_requests;
drop policy if exists "lsc pr staff update"   on public.print_requests;
drop policy if exists "lsc ann read"          on public.announcements;
drop policy if exists "lsc ann staff write"   on public.announcements;
drop policy if exists "lsc reads select own"  on public.announcement_reads;
drop policy if exists "lsc reads insert own"  on public.announcement_reads;
drop policy if exists "lsc notif select own"  on public.notifications;
drop policy if exists "lsc notif update own"  on public.notifications;
drop policy if exists "lsc notif delete own"  on public.notifications;

create policy "lsc rates read" on public.lsc_rates
  for select to authenticated using (true);

create policy "lsc pr select" on public.print_requests
  for select to authenticated using (user_id = auth.uid() or public.is_staff());
create policy "lsc pr insert own" on public.print_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy "lsc pr staff update" on public.print_requests
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "lsc ann read" on public.announcements
  for select to authenticated using (true);
create policy "lsc ann staff write" on public.announcements
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Own receipts only, so lscApi's embedded announcement_reads(user_id) means "I read it".
create policy "lsc reads select own" on public.announcement_reads
  for select to authenticated using (user_id = auth.uid());
create policy "lsc reads insert own" on public.announcement_reads
  for insert to authenticated with check (user_id = auth.uid());

-- Same own-row rules as Registrar/Infirmary (extra permissive copies are harmless).
create policy "lsc notif select own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "lsc notif update own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lsc notif delete own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ---------- Storage: private `print-files` bucket ----------
-- Path written by lscApi.ts: {auth.uid()}/{requestId}/{n}-{fileName}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('print-files', 'print-files', false, 10485760,
  array['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg','image/png'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "print-files insert own" on storage.objects;
drop policy if exists "print-files read"       on storage.objects;
drop policy if exists "print-files delete own" on storage.objects;

create policy "print-files insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'print-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "print-files read" on storage.objects
  for select to authenticated
  using (bucket_id = 'print-files'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy "print-files delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'print-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- sample data (optional) ----------
-- insert into public.announcements (title, message, pinned)
-- values ('Welcome to LSC', 'Print services are open Monday to Friday.', true);

-- Change a request's status (what your dev "Advance status" button logs).
-- Works in the SQL Editor or as an admin; each change sends the student a notification:
-- update public.print_requests set status = 'printing' where request_number = 'LSC-2026-00001';

-- 1) case-insensitive rate lookup
create or replace function public.lsc_before_insert_request()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  yr   int := extract(year from now())::int;
  n    int;
  rate numeric;
begin
  select price_per_page into rate from public.lsc_rates
   where lower(paper_size) = lower(new.paper_size)
     and lower(color)      = lower(new.color);
  if rate is null then
    raise exception 'No LSC rate for % / %', new.paper_size, new.color;
  end if;

  insert into public.lsc_counters (year, last) values (yr, 1)
  on conflict (year) do update set last = public.lsc_counters.last + 1
  returning last into n;

  new.user_id        := auth.uid();
  new.request_number := 'LSC-' || yr || '-' || lpad(n::text, 5, '0');
  new.status         := 'pending';
  new.total_bill     := rate * new.pages;
  new.created_at     := now();
  new.claimed_at     := null;
  return new;
end $$;

-- 2) replace the placeholder rates (values must match what your form sends)
delete from public.lsc_rates;
insert into public.lsc_rates (paper_size, color, price_per_page) values
  ('letter','colored',5), ('letter','bw',2),
  ('a4','colored',5),     ('a4','bw',2),
  ('legal','colored',6),  ('legal','bw',3);

  alter table public.notifications add column if not exists title text;

create table if not exists public.scholarships (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  required_documents text[] not null default '{}',
  data               jsonb not null default '{}',   -- every other field from your mock (description, deadline, slots...)
  is_active          boolean not null default true,
  created_at         timestamptz not null default now()
);

create sequence if not exists public.application_seq;

create table if not exists public.applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  scholarship_id uuid not null references public.scholarships(id),
  application_id text not null unique,                 -- e.g. SCH-2026-00001, set by the trigger
  contact        jsonb,
  gpa            text,
  document_files jsonb not null default '[]',          -- [{label, name, path}]
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  remarks        text not null default '',
  created_at     timestamptz not null default now()
);

-- one open application per scholarship
create unique index if not exists one_open_application_per_scholarship
  on public.applications (user_id, scholarship_id) where status in ('pending','approved');

alter table public.scholarships enable row level security;
alter table public.applications enable row level security;
grant select on public.scholarships to authenticated;
grant select, insert on public.applications to authenticated;

drop policy if exists "Signed-in users read scholarships" on public.scholarships;
drop policy if exists "Users read own applications"       on public.applications;
drop policy if exists "Users create own applications"     on public.applications;
create policy "Signed-in users read scholarships" on public.scholarships for select to authenticated using (true);
create policy "Users read own applications" on public.applications for select using (auth.uid() = user_id);
create policy "Users create own applications" on public.applications for insert
  with check (auth.uid() = user_id and status = 'pending');

/* the server decides the id, status and remarks, whatever the browser sends */
create or replace function public.applications_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.status := 'pending';
  new.remarks := '';
  -- change 'SCH' to match APPLICATION_ID_PREFIX in lib/scholarshipData.ts
  new.application_id := 'SCH-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.application_seq')::text, 5, '0');
  return new;
end $$;

drop trigger if exists trg_applications_before_insert on public.applications;
create trigger trg_applications_before_insert
  before insert on public.applications
  for each row execute function public.applications_before_insert();

/* notifications */
create or replace function public.notify_on_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare sname text; t text; m text;
begin
  select name into sname from public.scholarships where id = new.scholarship_id;

  if TG_OP = 'INSERT' then
    t := 'Application Submitted: ' || sname;
    m := 'Your application is now pending review.';
  elsif new.status is distinct from old.status then
    if new.status = 'approved' then
      t := 'Application Approved: ' || sname;
      m := 'Your ' || sname || ' application has been approved.';
    elsif new.status = 'rejected' then
      t := 'Application Rejected: ' || sname;
      m := 'Your ' || sname || ' application was rejected. Reason: '
           || coalesce(nullif(new.remarks, ''), 'Please contact the scholarship office.');
    else
      return new;
    end if;
  else
    return new;
  end if;

  insert into public.notifications (user_id, module, type, title, message)
  values (new.user_id, 'scholarship', 'application', t, m);
  return new;
end $$;

drop trigger if exists trg_notify_applications on public.applications;
create trigger trg_notify_applications
  after insert or update on public.applications
  for each row execute function public.notify_on_application();

/* private bucket for the uploaded documents (10 MB each; adjust the types to what your form accepts) */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scholarship-documents', 'scholarship-documents', false, 10485760,
        array['application/pdf','image/jpeg','image/png',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

drop policy if exists "Users upload own scholarship files" on storage.objects;
drop policy if exists "Users read own scholarship files"   on storage.objects;
drop policy if exists "Users delete own scholarship files" on storage.objects;
create policy "Users upload own scholarship files" on storage.objects for insert to authenticated
  with check (bucket_id = 'scholarship-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users read own scholarship files" on storage.objects for select to authenticated
  using (bucket_id = 'scholarship-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own scholarship files" on storage.objects for delete to authenticated
  using (bucket_id = 'scholarship-documents' and (storage.foldername(name))[1] = auth.uid()::text);

  insert into public.scholarships (name, required_documents, data)
select e->>'name',
       coalesce(array(select jsonb_array_elements_text(e->'requiredDocuments')), '{}'),
       e - 'id' - 'name' - 'requiredDocuments'
from jsonb_array_elements($json$ PASTE_JSON_HERE $json$::jsonb) as e;

   update public.applications set status = 'approved' where application_id = 'SCH-2026-00001';
   update public.applications set status = 'rejected', remarks = 'Incomplete documents' where application_id = '...';

   alter table public.registrar_requests drop constraint if exists registrar_requests_status_check;
alter table public.registrar_requests add constraint registrar_requests_status_check
  check (status in ('pending','processing','approved','ready','rejected'));

  /* 1. who counts as staff */
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

/* 2. extra columns */
alter table public.registrar_requests add column if not exists remarks text;
alter table public.subject_changes    add column if not exists remarks text;
alter table public.registrar_requests add column if not exists handled_by uuid references auth.users(id);
alter table public.registrar_requests add column if not exists handled_at timestamptz;
alter table public.subject_changes    add column if not exists handled_by uuid references auth.users(id);
alter table public.subject_changes    add column if not exists handled_at timestamptz;

/* 3. allow the 'approved' status on document requests */
alter table public.registrar_requests drop constraint if exists registrar_requests_status_check;
alter table public.registrar_requests add constraint registrar_requests_status_check
  check (status in ('pending','processing','approved','ready','rejected'));

/* 4. record which admin changed a status, and when */
create or replace function public.stamp_handler()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end $$;

/*
  Admin (Registrar) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER the student-side registrar SQL (registrar_requests, subject_changes,
  subjects, student_subjects, notifications and their triggers already exist).
*/

/* 1. who counts as staff (uses profiles.role) */
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

/* 2. extra columns: rejection remarks + which admin handled the request */
alter table public.registrar_requests add column if not exists remarks text;
alter table public.subject_changes    add column if not exists remarks text;
alter table public.registrar_requests add column if not exists handled_by uuid references auth.users(id);
alter table public.registrar_requests add column if not exists handled_at timestamptz;
alter table public.subject_changes    add column if not exists handled_by uuid references auth.users(id);
alter table public.subject_changes    add column if not exists handled_at timestamptz;

/* 3. allow the 'approved' status on document requests */
alter table public.registrar_requests drop constraint if exists registrar_requests_status_check;
alter table public.registrar_requests add constraint registrar_requests_status_check
  check (status in ('pending','processing','approved','ready','rejected'));

/* 4. record which admin changed a status, and when */
create or replace function public.stamp_handler()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end $$;

/*
  Admin (Registrar) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER the student-side registrar SQL (registrar_requests, subject_changes,
  subjects, student_subjects, notifications and their triggers already exist).
*/

/* 1. who counts as staff (uses profiles.role) */
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

/* 2. extra columns: rejection remarks + which admin handled the request */
alter table public.registrar_requests add column if not exists remarks text;
alter table public.subject_changes    add column if not exists remarks text;
alter table public.registrar_requests add column if not exists handled_by uuid references auth.users(id);
alter table public.registrar_requests add column if not exists handled_at timestamptz;
alter table public.subject_changes    add column if not exists handled_by uuid references auth.users(id);
alter table public.subject_changes    add column if not exists handled_at timestamptz;

/* 3. allow the 'approved' status on document requests */
alter table public.registrar_requests drop constraint if exists registrar_requests_status_check;
alter table public.registrar_requests add constraint registrar_requests_status_check
  check (status in ('pending','processing','approved','ready','rejected'));

/* 4. record which admin changed a status, and when */
create or replace function public.stamp_handler()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end $$;

/* 5. staff can read and update the registrar tables (students still can't update) */
grant select, update on public.registrar_requests to authenticated;
grant select, update on public.subject_changes    to authenticated;

drop policy if exists "Staff read all"   on public.registrar_requests;
drop policy if exists "Staff update all" on public.registrar_requests;
create policy "Staff read all"   on public.registrar_requests for select using (public.is_staff());
create policy "Staff update all" on public.registrar_requests for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff read all"   on public.subject_changes;
drop policy if exists "Staff update all" on public.subject_changes;
create policy "Staff read all"   on public.subject_changes for select using (public.is_staff());
create policy "Staff update all" on public.subject_changes for update using (public.is_staff()) with check (public.is_staff());

drop trigger if exists trg_stamp_handler on public.registrar_requests;
create trigger trg_stamp_handler before update on public.registrar_requests
  for each row execute function public.stamp_handler();

drop trigger if exists trg_stamp_handler on public.subject_changes;
create trigger trg_stamp_handler before update on public.subject_changes
  for each row execute function public.stamp_handler();

/* 6. staff manage the subjects catalog */
grant select, insert, update, delete on public.subjects to authenticated;
drop policy if exists "Staff manage" on public.subjects;
create policy "Staff manage" on public.subjects for all
  using (public.is_staff()) with check (public.is_staff());

/* 7. staff can see who the student is and what they're enrolled in */
drop policy if exists "Staff read profiles"         on public.profiles;
drop policy if exists "Staff read student profiles" on public.student_profiles;
drop policy if exists "Staff read enrollments"      on public.student_subjects;
create policy "Staff read profiles"         on public.profiles         for select using (public.is_staff());
create policy "Staff read student profiles" on public.student_profiles for select using (public.is_staff());
create policy "Staff read enrollments"      on public.student_subjects for select using (public.is_staff());

/* 8. staff can open uploaded attachments */
drop policy if exists "Staff read uploads" on storage.objects;
create policy "Staff read uploads" on storage.objects for select to authenticated
  using (bucket_id = 'request-attachments' and public.is_staff());

/* 9. approving an add/remove request also changes the student's subjects, in one step */
create or replace function public.resolve_subject_change(p_id uuid, p_approve boolean, p_remarks text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c public.subject_changes;
begin
  if not public.is_staff() then raise exception 'Not allowed.'; end if;

  select * into c from public.subject_changes where id = p_id and status = 'pending' for update;
  if not found then raise exception 'This request was already handled.'; end if;

  if p_approve then
    if c.kind = 'add' then
      insert into public.student_subjects (user_id, subject_code)
      values (c.user_id, c.subject_code)
      on conflict (user_id, subject_code) do update set status = 'enrolled';
    else
      delete from public.student_subjects where user_id = c.user_id and subject_code = c.subject_code;
    end if;
  end if;

  update public.subject_changes
     set status = case when p_approve then 'approved' else 'rejected' end,
         remarks = p_remarks
   where id = p_id;
end $$;
revoke all on function public.resolve_subject_change(uuid, boolean, text) from public;
grant execute on function public.resolve_subject_change(uuid, boolean, text) to authenticated;

/*
  Admin (Infirmary) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER:
    - the student-side infirmary SQL (appointments, notifications, notify_on_appointment, cancel_appointment)
    - supabase/admin-registrar.sql (creates is_staff(), the profile read policies)
*/

/* 0. make sure the helpers exist (harmless if they already do) */
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'superadmin'));
$$;
revoke all on function public.is_staff() from public;
grant execute on function public.is_staff() to authenticated;

create or replace function public.stamp_handler()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end $$;

/* 1. the clinic's note is separate from the student's own remarks, and we record who handled it */
alter table public.appointments add column if not exists admin_remarks text;
alter table public.appointments add column if not exists handled_by uuid references auth.users(id);
alter table public.appointments add column if not exists handled_at timestamptz;

/* 2. staff can read and update every appointment (students still can't update) */
grant select, update on public.appointments to authenticated;
drop policy if exists "Staff read all"   on public.appointments;
drop policy if exists "Staff update all" on public.appointments;
create policy "Staff read all"   on public.appointments for select using (public.is_staff());
create policy "Staff update all" on public.appointments for update using (public.is_staff()) with check (public.is_staff());

drop trigger if exists trg_stamp_handler on public.appointments;
create trigger trg_stamp_handler before update on public.appointments
  for each row execute function public.stamp_handler();

/* 3. student notifications now use the clinic's note (admin_remarks) */
create or replace function public.notify_on_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare what text; msg text; kind text := 'appointment';
begin
  what := new.service || ' appointment on ' || to_char(new.date, 'Mon DD, YYYY');

  if TG_OP = 'INSERT' then
    msg := 'Your ' || what || ' has been submitted.';
    kind := 'schedule-request';
  elsif new.status is distinct from old.status then
    msg := case new.status
      when 'approved'  then 'Your ' || what || ' has been approved.'
                            || coalesce(' Note: ' || nullif(new.admin_remarks, ''), '')
      when 'rejected'  then 'Your ' || what || ' was rejected. Reason: '
                            || coalesce(nullif(new.admin_remarks, ''), 'Please contact the clinic for more information.')
      when 'cancelled' then 'You cancelled your ' || what || '.'
      when 'completed' then 'Your ' || what || ' is marked as completed.'
      else 'Your ' || what || ' is now ' || new.status || '.'
    end;
  else
    return new;
  end if;

  insert into public.notifications (user_id, module, type, message)
  values (new.user_id, 'infirmary', kind, msg);
  return new;
end $$;

/* 4. services managed from the admin Services page */
create table if not exists public.services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text not null default '',
  is_available boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.services enable row level security;
grant select, insert, update, delete on public.services to authenticated;

drop policy if exists "Signed-in users read services" on public.services;
drop policy if exists "Staff manage services"         on public.services;
create policy "Signed-in users read services" on public.services for select to authenticated using (true);
create policy "Staff manage services" on public.services for all
  using (public.is_staff()) with check (public.is_staff());

/* starter services (edit them later from the Services page) */
insert into public.services (name, description, is_available) values
  ('Medical Consultation', 'Assessment and basic care for common illnesses and health concerns.', true),
  ('Vital Signs Check',    'Checking blood pressure, temperature, pulse, and other basic vital signs.', true),
  ('Dental Check-up',      'Basic dental examination to check teeth and oral health.', true),
  ('Medical Certificate',  'Issuance of a certificate confirming a student''s medical assessment or visit.', true),
  ('Vaccination',          'Administration of available vaccines for eligible students.', false),
  ('Eye Examination',      'Basic vision screening and eye health assessment.', false)
on conflict (name) do nothing;

/* 5. persist 'completed' for approved appointments whose time has passed */
create or replace function public.stamp_handler()
returns trigger language plpgsql as $$
begin
  -- system updates (no signed-in user, or the flag below) must not overwrite who approved it
  if new.status is distinct from old.status
     and auth.uid() is not null
     and coalesce(current_setting('app.skip_stamp', true), '') <> 'on' then
    new.handled_by := auth.uid();
    new.handled_at := now();
  end if;
  return new;
end $$;

create or replace function public.complete_past_appointments()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  perform set_config('app.skip_stamp', 'on', true);
  update public.appointments
     set status = 'completed'
   where status = 'approved'
     and (date + time_end) <= (now() at time zone 'Asia/Manila');  -- change if the school is not in the Philippines
  get diagnostics n = row_count;
  perform set_config('app.skip_stamp', 'off', true);
  return n;
end $$;
revoke all on function public.complete_past_appointments() from public;
grant execute on function public.complete_past_appointments() to authenticated;

/*
  OPTIONAL: also run it automatically every 15 minutes (enable pg_cron first:
  Dashboard > Database > Extensions > pg_cron), then:

  select cron.schedule('complete-past-appointments', '*/15 * * * *', $$select public.complete_past_appointments()$$);
*/

/*
  OPTIONAL: stop two students from being approved for the same time slot.
  Skip this if the clinic can see more than one student at the same time.

  alter table public.appointments add constraint appt_one_approved_per_slot
    exclude using gist (tsrange(date + time_start, date + time_end) with &&)
    where (status = 'approved');
*/

/*
  Admin (LSC) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER:
    - the student-side LSC SQL (print_requests, lsc_rates, lsc_notify_request, 'print-files' bucket,
      and its policies, which already let staff read/update print_requests and open print files)
    - supabase/admin-registrar.sql (is_staff(), stamp_handler(), staff profile read policies)
*/

/* 1. admin decision note + which admin handled the request */
alter table public.print_requests add column if not exists remarks    text;
alter table public.print_requests add column if not exists handled_by uuid references auth.users(id);
alter table public.print_requests add column if not exists handled_at timestamptz;

/* 2. the admin page can REJECT a request, so allow that status */
alter table public.print_requests drop constraint if exists print_requests_status_check;
alter table public.print_requests add constraint print_requests_status_check
  check (status in ('pending','printing','ready','claimed','cancelled','rejected'));

/* 3. staff may write the note (students still can't update: the RLS update policy is staff only) */
grant update (status, remarks) on public.print_requests to authenticated;

drop trigger if exists trg_stamp_handler on public.print_requests;
create trigger trg_stamp_handler before update on public.print_requests
  for each row execute function public.stamp_handler();

/* 4. student notifications: add the 'rejected' case and include the LSC's note */
create or replace function public.lsc_notify_request()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  ttl  text;
  msg  text;
  note text := coalesce(nullif(new.remarks, ''), '');
begin
  if tg_op = 'INSERT' then
    ttl := 'Print request submitted';
    msg := 'Your print request ' || new.request_number || ' was submitted.';
  elsif new.status is distinct from old.status then
    case new.status
      when 'printing'  then
        ttl := 'Print request is printing';
        msg := 'Your print request ' || new.request_number || ' is now being printed.'
               || case when note <> '' then ' Note: ' || note else '' end;
      when 'ready'     then
        ttl := 'Print request ready for claiming';
        msg := 'Your print request ' || new.request_number || ' is ready for claiming.'
               || case when note <> '' then ' Note: ' || note else '' end;
      when 'claimed'   then
        ttl := 'Print request claimed';
        msg := 'Your print request ' || new.request_number || ' was marked as claimed.';
      when 'cancelled' then
        ttl := 'Print request cancelled';
        msg := 'You cancelled your print request ' || new.request_number || '.';
      when 'rejected'  then
        ttl := 'Print request rejected';
        msg := 'Your print request ' || new.request_number || ' was rejected. Reason: '
               || coalesce(nullif(note, ''), 'Please contact the LSC for more information.');
      else
        return new;
    end case;
  else
    return new;
  end if;

  insert into public.notifications (user_id, module, type, title, message)
  values (new.user_id, 'lsc', 'print-request', ttl, msg);
  return new;
end $$;

/* 5. LSC services, managed from the admin Services page */
create table if not exists public.lsc_services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists lsc_services_name_unique on public.lsc_services (lower(name));

alter table public.lsc_services enable row level security;
grant select, insert, update, delete on public.lsc_services to authenticated;

drop policy if exists "Signed-in users read lsc services" on public.lsc_services;
drop policy if exists "Staff manage lsc services"         on public.lsc_services;
create policy "Signed-in users read lsc services" on public.lsc_services
  for select to authenticated using (true);
create policy "Staff manage lsc services" on public.lsc_services
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

/* starter services (edit them later from the Services page) */
insert into public.lsc_services (name, description, is_active) values
  ('Printing Service',   'Turning your digital files and documents into high-quality paper copies', true),
  ('Scanning Service',   'Converting your physical papers and photos into secure digital files', true),
  ('Photocopy Service',  'Making instant, accurate paper duplicates of your original documents', true),
  ('Laminating Service', 'Protecting your documents and IDs with a durable plastic seal', false),
  ('Document Binding',   'Binding thesis and project papers into finished copies', false),
  ('ID Photo Service',   'Taking and printing photos for student and application IDs', false)
on conflict do nothing;

/*
  Handling a request without the UI (the student is notified automatically):
  update public.print_requests set status = 'ready'   where request_number = 'LSC-2026-00001';
  update public.print_requests set status = 'claimed' where request_number = 'LSC-2026-00001';
*/

/*
  Admin (Scholarship) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER:
    - the student-side scholarship SQL (scholarships, applications, notify_on_application,
      the 'scholarship-documents' bucket)
    - supabase/admin-registrar.sql (creates is_staff(), stamp_handler(), and the
      "Staff read profiles" / "Staff read student profiles" policies)
*/

/* 1. record which admin handled the application, and when
      (applications.remarks already exists: it holds the decision note) */
alter table public.applications add column if not exists handled_by uuid references auth.users(id);
alter table public.applications add column if not exists handled_at timestamptz;

/* 2. staff can read and update every application (students still can't update) */
grant select, update on public.applications to authenticated;

drop policy if exists "Staff read all"   on public.applications;
drop policy if exists "Staff update all" on public.applications;
create policy "Staff read all"   on public.applications for select using (public.is_staff());
create policy "Staff update all" on public.applications for update
  using (public.is_staff()) with check (public.is_staff());

drop trigger if exists trg_stamp_handler on public.applications;
create trigger trg_stamp_handler before update on public.applications
  for each row execute function public.stamp_handler();

/* 3. staff manage the programs (scholarships table). No delete: applications point to it. */
grant select, insert, update on public.scholarships to authenticated;

drop policy if exists "Staff manage scholarships" on public.scholarships;
create policy "Staff manage scholarships" on public.scholarships for all
  using (public.is_staff()) with check (public.is_staff());

/* 4. staff can open the uploaded application documents */
drop policy if exists "Staff read scholarship files" on storage.objects;
create policy "Staff read scholarship files" on storage.objects for select to authenticated
  using (bucket_id = 'scholarship-documents' and public.is_staff());

/*
  Student notifications are NOT touched here: notify_on_application() (student-side SQL)
  already fires when status changes and uses applications.remarks as the rejection reason.
*/

/*
  ONE-TIME FIX: programs saved from the admin page BEFORE this change used the keys
  period_start / period_end, which the student card doesn't read (it crashed on `deadline`).
  Run this once to convert them. Safe to run more than once.
*/
update public.scholarships
set data = (data - 'period_start' - 'period_end') || jsonb_build_object(
  'applicationStart', coalesce(data->>'period_start', data->>'applicationStart', ''),
  'applicationEnd',   coalesce(data->>'period_end',   data->>'applicationEnd',   ''),
  'deadline',         coalesce(data->>'period_end',   data->>'deadline',         ''),
  'about',            coalesce(data->>'about', data->>'description', ''),
  'requiresGpa',      coalesce((data->>'requiresGpa')::boolean, false),
  'status',           case when is_active then 'Open' else 'Closed' end
)
where data ? 'period_start' or data ? 'period_end' or not (data ? 'deadline');

/*
  Admin (Scholarship) setup. Documentation copy: always run it in the Supabase SQL Editor.
  Safe to run more than once.

  Run AFTER:
    - the student-side scholarship SQL (scholarships, applications, notify_on_application,
      the 'scholarship-documents' bucket)
    - supabase/admin-registrar.sql (creates is_staff(), stamp_handler(), and the
      "Staff read profiles" / "Staff read student profiles" policies)
*/

/* 1. record which admin handled the application, and when
      (applications.remarks already exists: it holds the decision note) */
alter table public.applications add column if not exists handled_by uuid references auth.users(id);
alter table public.applications add column if not exists handled_at timestamptz;

/* 2. staff can read and update every application (students still can't update) */
grant select, update on public.applications to authenticated;

drop policy if exists "Staff read all"   on public.applications;
drop policy if exists "Staff update all" on public.applications;
create policy "Staff read all"   on public.applications for select using (public.is_staff());
create policy "Staff update all" on public.applications for update
  using (public.is_staff()) with check (public.is_staff());

drop trigger if exists trg_stamp_handler on public.applications;
create trigger trg_stamp_handler before update on public.applications
  for each row execute function public.stamp_handler();

/* 3. staff manage the programs (scholarships table). No delete: applications point to it. */
grant select, insert, update on public.scholarships to authenticated;

drop policy if exists "Staff manage scholarships" on public.scholarships;
create policy "Staff manage scholarships" on public.scholarships for all
  using (public.is_staff()) with check (public.is_staff());

/* 4. staff can open the uploaded application documents */
drop policy if exists "Staff read scholarship files" on storage.objects;
create policy "Staff read scholarship files" on storage.objects for select to authenticated
  using (bucket_id = 'scholarship-documents' and public.is_staff());

/*
  Student notifications are NOT touched here: notify_on_application() (student-side SQL)
  already fires when status changes and uses applications.remarks as the rejection reason.
*/

/*
  My Documents setup. Documentation copy: run it in the Supabase SQL Editor. Safe to re-run.
  Needs: public.profiles(id, role), public.is_staff() (from admin-registrar.sql),
         public.notifications (user_id, module, type, title, message).

  How it works:
    - documents.user_id   = the STUDENT the file belongs to
    - documents.uploaded_by = who actually uploaded it (set by the database)
    - category 'submitted'            -> uploaded by the student
    - category 'academic'/'generated' -> uploaded by an admin, for a chosen student
*/

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  name        text not null,
  category    text not null check (category in ('academic','generated','submitted')),
  doc_type    text not null,
  file_path   text not null unique,
  file_size   bigint,
  created_at  timestamptz not null default now()
);
create index if not exists documents_user_idx on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

grant select, insert, delete on public.documents to authenticated;

/* the browser never decides who uploaded the file */
create or replace function public.documents_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.uploaded_by := auth.uid();
  new.created_at  := now();
  return new;
end $$;

drop trigger if exists trg_documents_before_insert on public.documents;
create trigger trg_documents_before_insert before insert on public.documents
  for each row execute function public.documents_before_insert();

drop policy if exists "Students read own documents"   on public.documents;
drop policy if exists "Students submit own documents" on public.documents;
drop policy if exists "Students delete own submitted" on public.documents;
drop policy if exists "Staff read all documents"      on public.documents;
drop policy if exists "Staff add documents"           on public.documents;
drop policy if exists "Staff delete documents"        on public.documents;

create policy "Students read own documents" on public.documents
  for select to authenticated using (user_id = auth.uid());

-- students may only add to THEIR OWN "submitted" folders
create policy "Students submit own documents" on public.documents
  for insert to authenticated
  with check (user_id = auth.uid() and category = 'submitted');

create policy "Students delete own submitted" on public.documents
  for delete to authenticated
  using (user_id = auth.uid() and category = 'submitted');

create policy "Staff read all documents" on public.documents
  for select to authenticated using (public.is_staff());

-- staff may add any category for any student
create policy "Staff add documents" on public.documents
  for insert to authenticated with check (public.is_staff());

create policy "Staff delete documents" on public.documents
  for delete to authenticated using (public.is_staff());

/* tell the student when an admin adds a file for them */
create or replace function public.notify_on_document()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.category in ('academic','generated') then
    insert into public.notifications (user_id, module, type, title, message)
    values (new.user_id, 'documents', 'document', 'New document available',
            '"' || new.name || '" was added to your ' || new.category || ' documents.');
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_document on public.documents;
create trigger trg_notify_document after insert on public.documents
  for each row execute function public.notify_on_document();

/* ---------- Storage: private "documents" bucket ----------
   Path convention: <student_user_id>/<category>/<uuid>-<file name>
*/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760,
  array['application/pdf','image/jpeg','image/png',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents student read own"   on storage.objects;
drop policy if exists "documents student upload own" on storage.objects;
drop policy if exists "documents student delete own" on storage.objects;
drop policy if exists "documents staff read"         on storage.objects;
drop policy if exists "documents staff upload"       on storage.objects;
drop policy if exists "documents staff delete"       on storage.objects;

create policy "documents student read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- students can only write inside <their id>/submitted/
create policy "documents student upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents'
              and (storage.foldername(name))[1] = auth.uid()::text
              and (storage.foldername(name))[2] = 'submitted');

create policy "documents student delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents'
         and (storage.foldername(name))[1] = auth.uid()::text
         and (storage.foldername(name))[2] = 'submitted');

create policy "documents staff read" on storage.objects
  for select to authenticated using (bucket_id = 'documents' and public.is_staff());
create policy "documents staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and public.is_staff());
create policy "documents staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and public.is_staff());

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
