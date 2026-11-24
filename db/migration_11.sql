/*
  Student notifications feed. Documentation copy: run it in the Supabase SQL Editor. Safe to re-run.

  Nothing needs to be "compiled" from the offices at read time: registrar_requests, subject_changes,
  appointments, print_requests, applications and documents already write into the ONE table
  public.notifications through their triggers, tagged with module =
  'registrar' | 'infirmary' | 'lsc' | 'scholarship' | 'documents'.
  This block only fills the gaps the Notifications page needs.
*/

/* 1. the page's "Marked as Important" tab */
alter table public.notifications
  add column if not exists is_important boolean not null default false;

/* 2. every notification gets a title (registrar + infirmary triggers only write a message) */
create or replace function public.notification_default_title(p_module text)
returns text language sql immutable as $$
  select case p_module
    when 'registrar'   then 'Registrar Update'
    when 'infirmary'   then 'Infirmary Update'
    when 'scholarship' then 'Scholarship Update'
    when 'lsc'         then 'LSC Update'
    when 'documents'   then 'Document Update'
    else 'Notification'
  end;
$$;

create or replace function public.notifications_before_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  new.title := coalesce(nullif(btrim(new.title), ''), public.notification_default_title(new.module));
  return new;
end $$;

drop trigger if exists trg_notifications_before_insert on public.notifications;
create trigger trg_notifications_before_insert before insert on public.notifications
  for each row execute function public.notifications_before_insert();

/* backfill the old rows */
update public.notifications
set title = public.notification_default_title(module)
where title is null or btrim(title) = '';

/* 3. students may only flip is_read / is_important, never rewrite title or message */
revoke update on public.notifications from authenticated;
grant  update (is_read, is_important) on public.notifications to authenticated;

/* 4. one call that returns exactly what NotificationItem in page.tsx expects.
      SECURITY INVOKER (the default): RLS still applies, so a student only ever gets their own rows. */
create or replace function public.get_my_notifications(p_limit integer default 100)
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
  from public.notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 200);
$$;

revoke all on function public.get_my_notifications(integer) from public;
grant execute on function public.get_my_notifications(integer) to authenticated;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
