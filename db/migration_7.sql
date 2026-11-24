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