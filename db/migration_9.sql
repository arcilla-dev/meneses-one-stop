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