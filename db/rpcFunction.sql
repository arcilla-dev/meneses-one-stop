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