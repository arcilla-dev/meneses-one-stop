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