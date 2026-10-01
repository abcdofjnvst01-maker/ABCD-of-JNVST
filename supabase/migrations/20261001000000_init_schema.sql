-- Migration: 20261001000000_init_schema.sql
-- Description: Core schema for ABCD of JNVST (Phase 0)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. APPLICATION ROLES TABLE
CREATE TABLE IF NOT EXISTS public.application_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guardian')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_application_roles_user_id ON public.application_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_application_roles_role ON public.application_roles(role);

-- Helper function to check if current user is admin in RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.application_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GUARDIAN PROFILES
CREATE TABLE IF NOT EXISTS public.guardian_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_guardian_profiles_email ON public.guardian_profiles(email);

-- 3. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS public.student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    target_exam_year INTEGER NOT NULL DEFAULT 2027,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_state_district ON public.student_profiles(state, district);
CREATE INDEX IF NOT EXISTS idx_student_profiles_archived_at ON public.student_profiles(archived_at);

-- 4. GUARDIAN STUDENT LINKS (Many-to-Many / 1-to-Many guardian relationship)
CREATE TABLE IF NOT EXISTS public.guardian_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL REFERENCES public.guardian_profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'parent' CHECK (relationship IN ('parent', 'guardian', 'teacher', 'other')),
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_guardian_student UNIQUE (guardian_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_student_links_guardian ON public.guardian_student_links(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_student_links_student ON public.guardian_student_links(student_id);

-- 5. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_inr NUMERIC(10, 2) NOT NULL CHECK (price_inr >= 0),
    validity_days INTEGER NOT NULL DEFAULT 365,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- 6. STUDENT ENTITLEMENTS
CREATE TABLE IF NOT EXISTS public.student_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_entitlements_student_status ON public.student_entitlements(student_id, status);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.application_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Application Roles Policies
-- Users can read their own roles. Admins can view all roles.
CREATE POLICY "Users can read own role"
    ON public.application_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- Only admins or system triggers can insert/update/delete roles
CREATE POLICY "Admins can manage application roles"
    ON public.application_roles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Guardian Profiles Policies
-- Guardians can read/update only their own profile. Admins can read all.
CREATE POLICY "Guardians can view own profile"
    ON public.guardian_profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Guardians can update own profile"
    ON public.guardian_profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Guardians can insert own profile on signup"
    ON public.guardian_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- 3. Student Profiles Policies
-- Guardians can only view students linked to them. Admins can view all.
CREATE POLICY "Guardians can view linked students"
    ON public.student_profiles
    FOR SELECT
    TO authenticated
    USING (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM public.guardian_student_links
        WHERE guardian_student_links.student_id = student_profiles.id
          AND guardian_student_links.guardian_id = auth.uid()
      )
    );

CREATE POLICY "Guardians can insert student profile"
    ON public.student_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Linked in same transaction/action via guardian_student_links

CREATE POLICY "Guardians can update linked students"
    ON public.student_profiles
    FOR UPDATE
    TO authenticated
    USING (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM public.guardian_student_links
        WHERE guardian_student_links.student_id = student_profiles.id
          AND guardian_student_links.guardian_id = auth.uid()
      )
    )
    WITH CHECK (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM public.guardian_student_links
        WHERE guardian_student_links.student_id = student_profiles.id
          AND guardian_student_links.guardian_id = auth.uid()
      )
    );

-- 4. Guardian Student Links Policies
CREATE POLICY "Guardians can view own student links"
    ON public.guardian_student_links
    FOR SELECT
    TO authenticated
    USING (guardian_id = auth.uid() OR public.is_admin());

CREATE POLICY "Guardians can create own student links"
    ON public.guardian_student_links
    FOR INSERT
    TO authenticated
    WITH CHECK (guardian_id = auth.uid() OR public.is_admin());

CREATE POLICY "Guardians can delete own student links"
    ON public.guardian_student_links
    FOR DELETE
    TO authenticated
    USING (guardian_id = auth.uid() OR public.is_admin());

-- 5. Subscription Plans Policies
-- Active plans are readable by anyone authenticated, admins can manage
CREATE POLICY "Anyone authenticated can view active plans"
    ON public.subscription_plans
    FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage plans"
    ON public.subscription_plans
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Student Entitlements Policies
-- Guardians can view entitlements for their linked students. Admins can view/manage all.
CREATE POLICY "Guardians can view linked student entitlements"
    ON public.student_entitlements
    FOR SELECT
    TO authenticated
    USING (
      public.is_admin() OR
      EXISTS (
        SELECT 1 FROM public.guardian_student_links
        WHERE guardian_student_links.student_id = student_entitlements.student_id
          AND guardian_student_links.guardian_id = auth.uid()
      )
    );

CREATE POLICY "Admins can manage entitlements"
    ON public.student_entitlements
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Audit Logs Policies
-- Only admins can read audit logs. Nobody can update or delete audit logs.
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);
