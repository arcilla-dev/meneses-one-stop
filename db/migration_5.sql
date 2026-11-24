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