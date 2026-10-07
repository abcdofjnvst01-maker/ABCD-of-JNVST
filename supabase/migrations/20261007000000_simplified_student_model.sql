-- Migration: 20261007000000_simplified_student_model.sql
-- Description: Simplify to Direct Student Model (1 User = 1 Student Account) + Admin

-- 1. Ensure student_profiles is 1-to-1 with auth.users
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    state TEXT NOT NULL DEFAULT 'General',
    district TEXT NOT NULL DEFAULT 'General',
    target_exam_year INTEGER NOT NULL DEFAULT 2026,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add any missing columns to existing student_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.student_profiles ALTER COLUMN date_of_birth DROP NOT NULL;

-- 2. Update Application Roles to 'admin' | 'student'
ALTER TABLE public.application_roles DROP CONSTRAINT IF EXISTS application_roles_role_check;
ALTER TABLE public.application_roles ADD CONSTRAINT application_roles_role_check CHECK (role IN ('admin', 'student', 'guardian'));

-- Update existing guardian roles to student
UPDATE public.application_roles SET role = 'student' WHERE role = 'guardian';

-- 3. Relax / Update foreign key constraints on test_attempts and student_entitlements
ALTER TABLE IF EXISTS public.test_attempts DROP CONSTRAINT IF EXISTS test_attempts_student_id_fkey;
ALTER TABLE IF EXISTS public.test_attempts 
  ADD CONSTRAINT test_attempts_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.student_entitlements DROP CONSTRAINT IF EXISTS student_entitlements_student_id_fkey;
ALTER TABLE IF EXISTS public.student_entitlements 
  ADD CONSTRAINT student_entitlements_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;

-- 4. Update Row Level Security (RLS) Policies for direct student access

-- Student Profiles RLS
DROP POLICY IF EXISTS "Students can view own profile" ON public.student_profiles;
CREATE POLICY "Students can view own profile"
    ON public.student_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can insert own profile" ON public.student_profiles;
CREATE POLICY "Students can insert own profile"
    ON public.student_profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile"
    ON public.student_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- Test Attempts RLS
DROP POLICY IF EXISTS "Students can view own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Guardians can view linked student attempts" ON public.test_attempts;
CREATE POLICY "Students can view own test attempts"
    ON public.test_attempts FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can create own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Guardians can create attempts for linked students" ON public.test_attempts;
CREATE POLICY "Students can create own test attempts"
    ON public.test_attempts FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Students can update own test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Guardians can update attempts for linked students" ON public.test_attempts;
CREATE POLICY "Students can update own test attempts"
    ON public.test_attempts FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin())
    WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- Test Responses RLS
DROP POLICY IF EXISTS "Students can view own test responses" ON public.test_responses;
DROP POLICY IF EXISTS "Guardians can view responses for linked student attempts" ON public.test_responses;
CREATE POLICY "Students can view own test responses"
    ON public.test_responses FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            WHERE ta.id = test_responses.attempt_id
            AND ta.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can insert own test responses" ON public.test_responses;
DROP POLICY IF EXISTS "Guardians can insert responses for linked student attempts" ON public.test_responses;
CREATE POLICY "Students can insert own test responses"
    ON public.test_responses FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            WHERE ta.id = test_responses.attempt_id
            AND ta.student_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Students can update own test responses" ON public.test_responses;
DROP POLICY IF EXISTS "Guardians can update responses for linked student attempts" ON public.test_responses;
CREATE POLICY "Students can update own test responses"
    ON public.test_responses FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            WHERE ta.id = test_responses.attempt_id
            AND ta.student_id = auth.uid()
        )
    );

-- 5. Seed Demo Student Profiles
INSERT INTO public.student_profiles (id, full_name, email, state, district, target_exam_year)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Aarav Sharma', 'student@example.com', 'Rajasthan', 'Jaipur', 2026),
    ('22222222-2222-2222-2222-222222222222', 'Priya Patel', 'student2@example.com', 'Gujarat', 'Ahmedabad', 2026)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    state = EXCLUDED.state,
    district = EXCLUDED.district;
