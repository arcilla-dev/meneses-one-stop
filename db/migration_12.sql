/*
DRAFT: office-based admin access. Run in the Supabase SQL Editor. Safe to re-run.
Do NOT run until you have checked the assumptions marked ASSUMPTION.

Rules:
  - superadmin: every office
  - admin: only the office stored in profiles.office
  - one office per admin
*/

/* ---------------------------------------------------------------
   0. SECURITY FIX (independent of offices, run this first)
   Right now any signed-in user can update their own profiles row, and the
   table-wide UPDATE grant includes `role`. A student could make themselves
   superadmin from the browser console. Limit what users can write.
   ASSUMPTION: the profile page only edits full_name and avatar_url on
   profiles, and gender and age on student_profiles. Add any other column
   the page really edits, or that edit will fail.
--------------------------------------------------------------- */
revoke update on public.profiles from authenticated;
grant  update (full_name, avatar_url) on public.profiles to authenticated;

revoke update on public.student_profiles from authenticated;
grant  update (gender, age) on public.student_profiles to authenticated;

/* ---------------------------------------------------------------
   1. office column
--------------------------------------------------------------- */
alter table public.profiles add column if not exists office text;

alter table public.profiles drop constraint if exists profiles_office_check;
alter table public.profiles add constraint profiles_office_check
  check (office is null or office in ('registrar','infirmary','lsc','scholarship'));

-- every plain admin must have an office. NOT VALID so existing admins don't block this;
-- set their office (step 5), then run:
--   alter table public.profiles validate constraint profiles_admin_has_office;
alter table public.profiles drop constraint if exists profiles_admin_has_office;
alter table public.profiles add constraint profiles_admin_has_office
  check (role <> 'admin' or office is not null) not valid;

/* ---------------------------------------------------------------
   2. helper: is this user staff for THIS office?
   is_staff() stays as "any admin", used where every admin needs to see
   students (profiles, student_profiles).
--------------------------------------------------------------- */
create or replace function public.is_office_staff(p_office text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'superadmin' or (role = 'admin' and office = p_office))
  );
$$;
revoke all on function public.is_office_staff(text) from public;
grant execute on function public.is_office_staff(text) to authenticated;

/* ---------------------------------------------------------------
   3. REGISTRAR
--------------------------------------------------------------- */
drop policy if exists "Staff read all"   on public.registrar_requests;
drop policy if exists "Staff update all" on public.registrar_requests;
create policy "Registrar read all" on public.registrar_requests
  for select using (public.is_office_staff('registrar'));
create policy "Registrar update all" on public.registrar_requests
  for update using (public.is_office_staff('registrar')) with check (public.is_office_staff('registrar'));

drop policy if exists "Staff read all"   on public.subject_changes;
drop policy if exists "Staff update all" on public.subject_changes;
create policy "Registrar read all" on public.subject_changes
  for select using (public.is_office_staff('registrar'));
create policy "Registrar update all" on public.subject_changes
  for update using (public.is_office_staff('registrar')) with check (public.is_office_staff('registrar'));

drop policy if exists "Staff manage" on public.subjects;
create policy "Registrar manage subjects" on public.subjects
  for all using (public.is_office_staff('registrar')) with check (public.is_office_staff('registrar'));

drop policy if exists "Staff read enrollments" on public.student_subjects;
create policy "Registrar read enrollments" on public.student_subjects
  for select using (public.is_office_staff('registrar'));

drop policy if exists "Staff read uploads" on storage.objects;
create policy "Registrar read uploads" on storage.objects
  for select to authenticated
  using (bucket_id = 'request-attachments' and public.is_office_staff('registrar'));

create or replace function public.resolve_subject_change(p_id uuid, p_approve boolean, p_remarks text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c public.subject_changes;
begin
  if not public.is_office_staff('registrar') then raise exception 'Not allowed.'; end if;

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

/* ASSUMPTION: the "My Documents" uploads (academic / generated files) belong to the Registrar. */
drop policy if exists "Staff read all documents" on public.documents;
drop policy if exists "Staff add documents"      on public.documents;
drop policy if exists "Staff delete documents"   on public.documents;
create policy "Registrar read all documents" on public.documents
  for select to authenticated using (public.is_office_staff('registrar'));
create policy "Registrar add documents" on public.documents
  for insert to authenticated with check (public.is_office_staff('registrar'));
create policy "Registrar delete documents" on public.documents
  for delete to authenticated using (public.is_office_staff('registrar'));

drop policy if exists "documents staff read"   on storage.objects;
drop policy if exists "documents staff upload" on storage.objects;
drop policy if exists "documents staff delete" on storage.objects;
create policy "documents registrar read" on storage.objects
  for select to authenticated using (bucket_id = 'documents' and public.is_office_staff('registrar'));
create policy "documents registrar upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents' and public.is_office_staff('registrar'));
create policy "documents registrar delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents' and public.is_office_staff('registrar'));

/* ---------------------------------------------------------------
   4. INFIRMARY
--------------------------------------------------------------- */
drop policy if exists "Staff read all"   on public.appointments;
drop policy if exists "Staff update all" on public.appointments;
create policy "Infirmary read all" on public.appointments
  for select using (public.is_office_staff('infirmary'));
create policy "Infirmary update all" on public.appointments
  for update using (public.is_office_staff('infirmary')) with check (public.is_office_staff('infirmary'));

drop policy if exists "Staff manage services" on public.services;
create policy "Infirmary manage services" on public.services
  for all using (public.is_office_staff('infirmary')) with check (public.is_office_staff('infirmary'));

/* ---------------------------------------------------------------
   5. LSC
--------------------------------------------------------------- */
drop policy if exists "lsc pr select"       on public.print_requests;
drop policy if exists "lsc pr staff update" on public.print_requests;
create policy "lsc pr select" on public.print_requests
  for select to authenticated using (user_id = auth.uid() or public.is_office_staff('lsc'));
create policy "lsc pr staff update" on public.print_requests
  for update to authenticated using (public.is_office_staff('lsc')) with check (public.is_office_staff('lsc'));

drop policy if exists "lsc ann staff write" on public.announcements;
create policy "lsc ann staff write" on public.announcements
  for all to authenticated using (public.is_office_staff('lsc')) with check (public.is_office_staff('lsc'));

drop policy if exists "Staff manage lsc services" on public.lsc_services;
create policy "Staff manage lsc services" on public.lsc_services
  for all to authenticated using (public.is_office_staff('lsc')) with check (public.is_office_staff('lsc'));

drop policy if exists "print-files read" on storage.objects;
create policy "print-files read" on storage.objects
  for select to authenticated
  using (bucket_id = 'print-files'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_office_staff('lsc')));

/* ---------------------------------------------------------------
   6. SCHOLARSHIP
--------------------------------------------------------------- */
drop policy if exists "Staff read all"   on public.applications;
drop policy if exists "Staff update all" on public.applications;
create policy "Scholarship read all" on public.applications
  for select using (public.is_office_staff('scholarship'));
create policy "Scholarship update all" on public.applications
  for update using (public.is_office_staff('scholarship')) with check (public.is_office_staff('scholarship'));

drop policy if exists "Staff manage scholarships" on public.scholarships;
create policy "Scholarship manage programs" on public.scholarships
  for all using (public.is_office_staff('scholarship')) with check (public.is_office_staff('scholarship'));

drop policy if exists "Staff read scholarship files" on storage.objects;
create policy "Scholarship read files" on storage.objects
  for select to authenticated
  using (bucket_id = 'scholarship-documents' and public.is_office_staff('scholarship'));

/* ---------------------------------------------------------------
   7. assign offices to your existing admins (edit the emails)
--------------------------------------------------------------- */
-- update public.profiles set office = 'registrar'   where email = 'registrar@example.com' and role = 'admin';
-- update public.profiles set office = 'infirmary'   where email = 'infirmary@example.com' and role = 'admin';
-- update public.profiles set office = 'lsc'         where email = 'lsc@example.com'       and role = 'admin';
-- update public.profiles set office = 'scholarship' where email = 'scholarship@example.com' and role = 'admin';
-- alter table public.profiles validate constraint profiles_admin_has_office;

update public.profiles set office = 'lsc' where email = 'that-admin@example.com' and role = 'admin';

update public.profiles set office = 'registrar'   where email = 'registrar@yourschool.edu'   and role = 'admin';
update public.profiles set office = 'infirmary'   where email = 'infirmary@yourschool.edu'   and role = 'admin';
update public.profiles set office = 'scholarship' where email = 'scholarship@yourschool.edu' and role = 'admin';
update public.profiles set office = 'lsc'         where email = 'lsc@yourschool.edu'         and role = 'admin';

alter table public.profiles validate constraint profiles_admin_has_office;