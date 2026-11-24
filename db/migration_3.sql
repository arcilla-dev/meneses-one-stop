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