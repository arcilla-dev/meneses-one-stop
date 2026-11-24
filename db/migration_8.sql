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