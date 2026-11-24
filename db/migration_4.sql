alter table profiles add column if not exists full_name text;

update profiles set full_name = 'Your Superadmin Name' where role = 'superadmin';