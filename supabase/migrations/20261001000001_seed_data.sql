-- Migration: 20261001000001_seed_data.sql
-- Description: Seed initial ₹500 subscription plan and update triggers

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS tr_guardian_profiles_updated_at ON public.guardian_profiles;
CREATE TRIGGER tr_guardian_profiles_updated_at
  BEFORE UPDATE ON public.guardian_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER tr_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER tr_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_student_entitlements_updated_at ON public.student_entitlements;
CREATE TRIGGER tr_student_entitlements_updated_at
  BEFORE UPDATE ON public.student_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed the ₹500 JNVST Class 6 Preparation Plan
INSERT INTO public.subscription_plans (id, code, title, description, price_inr, validity_days, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'jnvst_class_6_full_prep',
    'JNVST Class 6 Full Preparation Package',
    'Complete syllabus coverage including Mental Ability, Arithmetic, and Language with mock tests, sectional practice, and performance analytics.',
    500.00,
    365,
    true
)
ON CONFLICT (code) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    price_inr = EXCLUDED.price_inr,
    validity_days = EXCLUDED.validity_days,
    is_active = EXCLUDED.is_active;
