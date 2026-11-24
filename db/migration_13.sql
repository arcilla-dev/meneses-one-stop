/*
  ADMIN notifications: what students do in the four office pages shows up on the admin Notifications page.

    registrar_requests  insert            -> registrar    "New document request"
    subject_changes     insert            -> registrar    "New add/remove-subject request"
    appointments        insert / cancel   -> infirmary    "New schedule request" / "Appointment cancelled"
    applications        insert            -> scholarship  "New scholarship application"
    print_requests      insert / cancel   -> lsc          "New print request" / "Print request cancelled"

  Needs (earlier in this file): profiles(id, role, full_name, office), is_staff(), and the five tables above.
  This is a SEPARATE table from public.notifications, which stays the students' own inbox.
  Safe to re-run.

  Who sees what: a superadmin sees every office. An admin sees the office in profiles.office
  ("Registrar's Office", "Infirmary", "Scholarship Office", "LSC" ...). An admin with NO office set also sees
  everything, so a missing office never hides notifications. Set it per admin (see the bottom of this file).
  Read / important flags are shared by the admins of the same office (one inbox per office).
*/

/* 1. the table */
alter table public.profiles add column if not exists office text;

create table if not exists public.admin_notifications (
  id           uuid primary key default gen_random_uuid(),
  module       text not null check (module in ('registrar','infirmary','scholarship','lsc')),
  type         text,
  title        text not null,
  message      text not null,
  student_id   uuid references auth.users(id) on delete set null,
  ref_id       uuid,                                  -- the request / appointment / application it is about
  is_read      boolean not null default false,
  is_important boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);

/* 2. which offices the signed-in admin may see */
create or replace function public.staff_can_see_module(p_module text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'superadmin')
      and (
        p.role = 'superadmin'
        or nullif(btrim(p.office), '') is null
        or case p_module
             when 'registrar'   then p.office ilike '%registrar%'
             when 'infirmary'   then p.office ilike '%infirmary%' or p.office ilike '%clinic%'
             when 'scholarship' then p.office ilike '%scholarship%'
             when 'lsc'         then p.office ilike '%lsc%' or p.office ilike '%student council%'
             else false
           end
      )
  );
$$;
revoke all on function public.staff_can_see_module(text) from public;
grant execute on function public.staff_can_see_module(text) to authenticated;

/* 3. security: staff read and flag their office's rows. Nobody inserts or deletes from the browser. */
alter table public.admin_notifications enable row level security;
revoke all on public.admin_notifications from anon, authenticated;
grant select on public.admin_notifications to authenticated;
grant update (is_read, is_important) on public.admin_notifications to authenticated;

drop policy if exists "Staff read admin notifications"   on public.admin_notifications;
drop policy if exists "Staff update admin notifications" on public.admin_notifications;
create policy "Staff read admin notifications" on public.admin_notifications
  for select to authenticated using (public.staff_can_see_module(module));
create policy "Staff update admin notifications" on public.admin_notifications
  for update to authenticated
  using (public.staff_can_see_module(module)) with check (public.staff_can_see_module(module));

/* 4. the database writes them, whatever the student's browser does */
create or replace function public.notify_staff_of_student_action()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  who  text;
  mod  text;
  kind text;
  ttl  text;
  msg  text;
  sch  text;
begin
  select coalesce(nullif(btrim(full_name), ''), 'A student') into who
  from public.profiles where id = new.user_id;
  who := coalesce(who, 'A student');

  if TG_TABLE_NAME = 'registrar_requests' then
    mod := 'registrar'; kind := 'document-request'; ttl := 'New document request';
    msg := who || ' requested ' || initcap(replace(new.request_type, '_', ' ')) || '.';

  elsif TG_TABLE_NAME = 'subject_changes' then
    mod := 'registrar'; kind := 'subject-change';
    ttl := case new.kind when 'add' then 'New add-subject request' else 'New remove-subject request' end;
    msg := who || ' asked to ' || new.kind || ' ' || new.subject_code || ' (' || new.subject_title || ').';

  elsif TG_TABLE_NAME = 'appointments' then
    mod := 'infirmary';
    if TG_OP = 'INSERT' then
      kind := 'schedule-request'; ttl := 'New schedule request';
      msg := who || ' requested a ' || new.service || ' appointment on ' || to_char(new.date, 'Mon DD, YYYY') || '.';
    elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      kind := 'appointment-cancelled'; ttl := 'Appointment cancelled';
      msg := who || ' cancelled the ' || new.service || ' appointment on ' || to_char(new.date, 'Mon DD, YYYY') || '.';
    else
      return new;
    end if;

  elsif TG_TABLE_NAME = 'applications' then
    mod := 'scholarship'; kind := 'application'; ttl := 'New scholarship application';
    select name into sch from public.scholarships where id = new.scholarship_id;
    msg := who || ' applied for ' || coalesce(sch, 'a scholarship') || ' (' || new.application_id || ').';

  elsif TG_TABLE_NAME = 'print_requests' then
    mod := 'lsc';
    if TG_OP = 'INSERT' then
      kind := 'print-request'; ttl := 'New print request';
      msg := who || ' submitted print request ' || new.request_number || '.';
    elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' then
      kind := 'print-cancelled'; ttl := 'Print request cancelled';
      msg := who || ' cancelled print request ' || new.request_number || '.';
    else
      return new;
    end if;

  else
    return new;
  end if;

  insert into public.admin_notifications (module, type, title, message, student_id, ref_id)
  values (mod, kind, ttl, msg, new.user_id, new.id);
  return new;
end $$;
revoke all on function public.notify_staff_of_student_action() from public;

drop trigger if exists trg_staff_notify_registrar on public.registrar_requests;
create trigger trg_staff_notify_registrar after insert on public.registrar_requests
  for each row execute function public.notify_staff_of_student_action();

drop trigger if exists trg_staff_notify_subject_changes on public.subject_changes;
create trigger trg_staff_notify_subject_changes after insert on public.subject_changes
  for each row execute function public.notify_staff_of_student_action();

drop trigger if exists trg_staff_notify_appointments_ins on public.appointments;
create trigger trg_staff_notify_appointments_ins after insert on public.appointments
  for each row execute function public.notify_staff_of_student_action();
drop trigger if exists trg_staff_notify_appointments_upd on public.appointments;
create trigger trg_staff_notify_appointments_upd after update of status on public.appointments
  for each row execute function public.notify_staff_of_student_action();

drop trigger if exists trg_staff_notify_applications on public.applications;
create trigger trg_staff_notify_applications after insert on public.applications
  for each row execute function public.notify_staff_of_student_action();

drop trigger if exists trg_staff_notify_print_ins on public.print_requests;
create trigger trg_staff_notify_print_ins after insert on public.print_requests
  for each row execute function public.notify_staff_of_student_action();
drop trigger if exists trg_staff_notify_print_upd on public.print_requests;
create trigger trg_staff_notify_print_upd after update of status on public.print_requests
  for each row execute function public.notify_staff_of_student_action();

/* 5. one call that returns exactly what NotificationItem in the admin Notifications page.tsx expects.
      SECURITY INVOKER: RLS above decides which offices the admin gets. */
create or replace function public.get_admin_notifications(p_limit integer default 100)
returns table (
  id                uuid,
  title             text,
  message           text,
  created_at        timestamptz,
  is_read           boolean,
  is_important      boolean,
  notification_type text
)
language sql stable set search_path = public as $$
  select n.id, n.title, n.message, n.created_at, n.is_read, n.is_important, n.module
  from public.admin_notifications n
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;
revoke all on function public.get_admin_notifications(integer) from public;
grant execute on function public.get_admin_notifications(integer) to authenticated;

/* 6. live updates: lets the page add a notification the moment a student submits something */
do $$
begin
  alter publication supabase_realtime add table public.admin_notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

/* 7. set the office of each admin (same as the announcements section; run once per admin)
update public.profiles set office = 'Scholarship Office'
  where id = (select id from auth.users where email = 'scholarship.admin@example.com');
*/