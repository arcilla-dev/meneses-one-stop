create table if not exists public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  contact_email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.offices (name)
values ('Registrar'), ('Infirmary'), ('Scholarship'), ('LSC')
on conflict (name) do nothing;

alter table public.profiles
  add column if not exists office_id uuid references public.offices(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists student_number text,
  add column if not exists phone text,
  add column if not exists program text,
  add column if not exists year_section text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_office_id_idx on public.profiles (office_id);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  office_id uuid not null references public.offices(id) on delete restrict,
  title text not null,
  description text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_office_status_idx on public.requests (office_id, status);
create index if not exists requests_requester_id_idx on public.requests (requester_id);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  content text not null default '',
  status text not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_office_status_idx on public.announcements (office_id, status);
create index if not exists announcements_published_at_idx on public.announcements (published_at desc);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_user_id_idx on public.activity_logs (actor_user_id);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('superadmin', 'super_admin')
      and p.is_active
  );
$$;

create or replace function public.is_assigned_office_admin(target_office_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text in ('admin', 'office_admin')
      and p.office_id = target_office_id
      and p.is_active
  );
$$;

create or replace function public.is_student()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role::text = 'student'
      and p.is_active
  );
$$;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_assigned_office_admin(uuid) from public;
revoke all on function public.is_student() from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_assigned_office_admin(uuid) to authenticated;
grant execute on function public.is_student() to authenticated;

alter table public.profiles enable row level security;
alter table public.offices enable row level security;
alter table public.requests enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_logs enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', existing_policy.policyname);
  end loop;
end;
$$;

drop policy if exists "profiles_read_self_or_super_admin" on public.profiles;
create policy "profiles_read_self_or_super_admin"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or exists (
      select 1 from public.requests r
      where r.requester_id = profiles.id
        and public.is_assigned_office_admin(r.office_id)
    )
    or exists (
      select 1 from public.announcements a
      where a.created_by = profiles.id
        and public.is_assigned_office_admin(a.office_id)
    )
  );

drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin"
  on public.profiles for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "offices_read_assigned_or_super_admin" on public.offices;
create policy "offices_read_assigned_or_super_admin"
  on public.offices for select to authenticated
  using (public.is_super_admin() or public.is_assigned_office_admin(id) or public.is_student());

drop policy if exists "offices_manage_super_admin" on public.offices;
create policy "offices_manage_super_admin"
  on public.offices for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "requests_read_authorized" on public.requests;
create policy "requests_read_authorized"
  on public.requests for select to authenticated
  using (
    public.is_super_admin()
    or requester_id = auth.uid()
    or public.is_assigned_office_admin(office_id)
  );

drop policy if exists "students_create_own_requests" on public.requests;
create policy "students_create_own_requests"
  on public.requests for insert to authenticated
  with check (requester_id = auth.uid() and public.is_student());

drop policy if exists "assigned_office_admins_update_requests" on public.requests;
create policy "assigned_office_admins_update_requests"
  on public.requests for update to authenticated
  using (public.is_assigned_office_admin(office_id))
  with check (public.is_assigned_office_admin(office_id));

drop policy if exists "announcements_read_authorized" on public.announcements;
create policy "announcements_read_authorized"
  on public.announcements for select to authenticated
  using (
    public.is_super_admin()
    or public.is_assigned_office_admin(office_id)
    or (public.is_student() and status = 'published')
  );

drop policy if exists "assigned_office_admins_manage_announcements" on public.announcements;
create policy "assigned_office_admins_manage_announcements"
  on public.announcements for all to authenticated
  using (public.is_assigned_office_admin(office_id))
  with check (public.is_assigned_office_admin(office_id));

drop policy if exists "super_admin_read_activity_logs" on public.activity_logs;
create policy "super_admin_read_activity_logs"
  on public.activity_logs for select to authenticated
  using (public.is_super_admin());

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.offices to authenticated;
grant select, insert, update on public.requests to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.activity_logs to authenticated;
grant all privileges on public.offices, public.requests, public.announcements, public.activity_logs to service_role;
grant select, insert, update, delete on public.profiles to service_role;

create or replace function public.log_admin_dashboard_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
declare
  row_data jsonb;
  log_action text;
  log_entity_id uuid;
  log_details jsonb;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    row_data := to_jsonb(old);
  else
    row_data := to_jsonb(new);
  end if;

  log_entity_id := (row_data ->> 'id')::uuid;
  log_action := lower(tg_op) || '_' || tg_table_name;

  if tg_table_name = 'profiles' then
    log_details := jsonb_build_object('role', row_data ->> 'role', 'office_id', row_data ->> 'office_id');
  elsif tg_table_name = 'requests' then
    log_details := jsonb_build_object('status', row_data ->> 'status', 'office_id', row_data ->> 'office_id');
  elsif tg_table_name = 'announcements' then
    log_details := jsonb_build_object('status', row_data ->> 'status', 'office_id', row_data ->> 'office_id');
  else
    log_details := jsonb_build_object('name', row_data ->> 'name');
  end if;

  insert into public.activity_logs (actor_user_id, action, entity_type, entity_id, details)
  values (auth.uid(), log_action, tg_table_name, log_entity_id, log_details);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_admin_activity_log on public.profiles;
create trigger profiles_admin_activity_log
  after insert or update or delete on public.profiles
  for each row execute function public.log_admin_dashboard_activity();

drop trigger if exists offices_admin_activity_log on public.offices;
create trigger offices_admin_activity_log
  after insert or update or delete on public.offices
  for each row execute function public.log_admin_dashboard_activity();

drop trigger if exists requests_admin_activity_log on public.requests;
create trigger requests_admin_activity_log
  after insert or update or delete on public.requests
  for each row execute function public.log_admin_dashboard_activity();

drop trigger if exists announcements_admin_activity_log on public.announcements;
create trigger announcements_admin_activity_log
  after insert or update or delete on public.announcements
  for each row execute function public.log_admin_dashboard_activity();

revoke all on function public.log_admin_dashboard_activity() from public;
