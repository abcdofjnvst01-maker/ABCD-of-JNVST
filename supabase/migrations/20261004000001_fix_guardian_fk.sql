-- Migration: 20261004000001_fix_guardian_fk.sql
-- Description: Drop strict auth.users FK constraints so demo accounts and mock environments can register students seamlessly

ALTER TABLE IF EXISTS public.guardian_student_links 
  DROP CONSTRAINT IF EXISTS guardian_student_links_guardian_id_fkey;

ALTER TABLE IF EXISTS public.guardian_profiles 
  DROP CONSTRAINT IF EXISTS guardian_profiles_id_fkey;

ALTER TABLE IF EXISTS public.application_roles
  DROP CONSTRAINT IF EXISTS application_roles_user_id_fkey;
