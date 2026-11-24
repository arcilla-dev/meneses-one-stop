-- Allow authenticated users to read their profiles
GRANT SELECT ON TABLE public.profiles TO authenticated;

-- Allow authenticated users to update profiles
GRANT UPDATE ON TABLE public.profiles TO authenticated;

-- Allow authenticated users to read student profiles
GRANT SELECT ON TABLE public.student_profiles TO authenticated;  

-- Set safe column-level update permissions
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

GRANT UPDATE (full_name, avatar_url)
ON TABLE public.profiles
TO authenticated;

REVOKE UPDATE ON TABLE public.student_profiles FROM authenticated;

GRANT UPDATE (gender, age)
ON TABLE public.student_profiles
TO authenticated;

GRANT UPDATE (gender, age, phone, program, year_section)
ON TABLE public.student_profiles
TO authenticated;

GRANT UPDATE (full_name, avatar_url)
ON TABLE public.profiles TO authenticated;

GRANT UPDATE (gender, age, phone, program, year_section)
ON TABLE public.student_profiles TO authenticated;