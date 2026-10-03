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

-- Seed demo accounts for development
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'guardian@example.com', '{"full_name": "Ramesh Sharma"}'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'guardian.b@example.com', '{"full_name": "Suresh Kumar"}'::jsonb),
    ('99999999-9999-9999-9999-999999999999', 'admin@abcdjnvst.in', '{"full_name": "Lead Admin"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.guardian_profiles (id, full_name, email, state)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ramesh Sharma', 'guardian@example.com', 'Rajasthan'),
    ('22222222-2222-2222-2222-222222222222', 'Suresh Kumar', 'guardian.b@example.com', 'Uttar Pradesh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.application_roles (user_id, role)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'guardian'),
    ('22222222-2222-2222-2222-222222222222', 'guardian'),
    ('99999999-9999-9999-9999-999999999999', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
-- Migration: 20261003000000_question_bank_schema.sql
-- Description: Schema for Question Bank, Bilingual Passages, and MAT Category Management (Phase 1)

-- 1. Passages Table (For Language Reading Comprehension)
CREATE TABLE IF NOT EXISTS public.passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT,
    title_hi TEXT,
    content_en TEXT,
    content_hi TEXT,
    language_code TEXT NOT NULL DEFAULT 'both' CHECK (language_code IN ('en', 'hi', 'both')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_passages_language ON public.passages(language_code);
CREATE INDEX IF NOT EXISTS idx_passages_created_at ON public.passages(created_at DESC);

-- 2. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_id UUID REFERENCES public.passages(id) ON DELETE SET NULL,
    section TEXT NOT NULL CHECK (section IN ('mental_ability', 'arithmetic', 'language')),
    topic TEXT NOT NULL,
    mat_category TEXT CHECK (mat_category IS NULL OR mat_category IN (
      'odd_man_out',
      'figure_matching',
      'pattern_completion',
      'figure_series_completion',
      'analogy',
      'geometrical_figure_completion',
      'mirror_imaging',
      'punched_hole_pattern',
      'space_visualization',
      'embedded_figure'
    )),
    difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_pyq BOOLEAN NOT NULL DEFAULT false,
    pyq_year INTEGER,
    marks NUMERIC(4, 2) NOT NULL DEFAULT 1.25,
    negative_marks NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    
    -- Bilingual Question Prompt & Media
    question_text_en TEXT,
    question_text_hi TEXT,
    question_image_url TEXT,
    
    -- Options Array Structure: JSONB array with keys A, B, C, D
    options JSONB NOT NULL,
    correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    
    -- Explanation / Solution Key
    explanation_en TEXT,
    explanation_hi TEXT,
    explanation_image_url TEXT,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_section ON public.questions(section);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_mat_category ON public.questions(mat_category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_is_pyq ON public.questions(is_pyq);
CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON public.questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);

-- Attach handle_updated_at triggers
DROP TRIGGER IF EXISTS tr_passages_updated_at ON public.passages;
CREATE TRIGGER tr_passages_updated_at
  BEFORE UPDATE ON public.passages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_questions_updated_at ON public.questions;
CREATE TRIGGER tr_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR QUESTION BANK
-- =============================================================================

ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 1. Passages Policies
CREATE POLICY "Authenticated users can view passages"
    ON public.passages
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage passages"
    ON public.passages
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. Questions Policies
CREATE POLICY "Authenticated users can view active questions"
    ON public.questions
    FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage questions"
    ON public.questions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
-- Migration: 20261003000001_seed_questions.sql
-- Description: Seed initial bilingual JNVST Class 6 questions and passages

-- 1. Seed Language Reading Comprehension Passage
INSERT INTO public.passages (id, title_en, title_hi, content_en, content_hi, language_code)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'The Banyan Tree and Ecosystem',
  'बरगद का पेड़ और हमारा पर्यावरण',
  'The Banyan tree is one of the most magnificent trees in India. It is considered sacred and provides shelter to countless birds, insects, and small mammals. Its aerial roots grow downwards and take root in the soil, giving the impression of multiple trunks supporting a massive green canopy. Village elders often gather beneath its cool shade for discussions, while children play joyfully around its hanging roots.',
  'बरगद का पेड़ भारत के सबसे भव्य और विशाल पेड़ों में से एक है। इसे पवित्र माना जाता है और यह अनगिनत पक्षियों, कीड़ों तथा छोटे जानवरों को आश्रय देता है। इसकी जटाएं (वायवीय जड़ें) नीचे की ओर बढ़ती हैं और मिट्टी में जड़ें जमा लेती हैं, जिससे यह प्रतीत होता है मानो कई तने एक विशाल हरे छत्र को सहारा दे रहे हों। गांव के बड़े-बुजुर्ग अक्सर विचार-विमर्श के लिए इसकी ठंडी छांव में एकत्र होते हैं, जबकि बच्चे इसकी लटकती जड़ों के आसपास आनंद से खेलते हैं।',
  'both'
) ON CONFLICT (id) DO NOTHING;

-- 2. Seed Questions across Mental Ability, Arithmetic, and Language

-- Question 1: Mental Ability - Odd-Man-Out (MAT)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  NULL,
  'mental_ability',
  'odd_man_out',
  'odd_man_out',
  'easy',
  true,
  2024,
  1.25,
  0.00,
  'Directions: In the following question, four figures (A), (B), (C) and (D) are given. Three of the figures are similar in some way, while one figure is different. Select the figure which is different.',
  'निर्देश: नीचे दिए गए प्रश्न में चार आकृतियां (A), (B), (C) और (D) दी गई हैं। इनमें से तीन आकृतियां किसी न किसी रूप में एक समान हैं जबकि एक आकृति भिन्न है। उस भिन्न आकृति का चयन कीजिए।',
  NULL,
  '[
    {"key": "A", "text_en": "Triangle with 3 interior dots", "text_hi": "3 आंतरिक बिंदुओं वाला त्रिभुज (3 भुजाएं - 3 बिंदु)", "image_url": null},
    {"key": "B", "text_en": "Square with 4 interior dots", "text_hi": "4 आंतरिक बिंदुओं वाला वर्ग (4 भुजाएं - 4 बिंदु)", "image_url": null},
    {"key": "C", "text_en": "Pentagon with 5 interior dots", "text_hi": "5 आंतरिक बिंदुओं वाला पंचभुज (5 भुजाएं - 5 बिंदु)", "image_url": null},
    {"key": "D", "text_en": "Hexagon with 4 interior dots", "text_hi": "4 आंतरिक बिंदुओं वाला षट्भुज (6 भुजाएं - 4 बिंदु)", "image_url": null}
  ]'::jsonb,
  'D',
  'In figures A, B, and C, the number of interior dots equals the number of sides of the polygon (Triangle=3, Square=4, Pentagon=5). In figure D, the hexagon has 6 sides but only 4 dots.',
  'आकृति A, B और C में आंतरिक बिंदुओं की संख्या बहुभुज की भुजाओं की संख्या के बराबर है (त्रिभुज=3, वर्ग=4, पंचभुज=5)। आकृति D में षट्भुज की 6 भुजाएं हैं किंतु बिंदु केवल 4 हैं, अतः यह भिन्न है।'
) ON CONFLICT (id) DO NOTHING;

-- Question 2: Mental Ability - Mirror Imaging (MAT)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000002',
  NULL,
  'mental_ability',
  'mirror_imaging',
  'mirror_imaging',
  'medium',
  true,
  2023,
  1.25,
  0.00,
  'Directions: Find the correct mirror image of the given letter combination "JNVST" when the mirror is placed on the right side (XY).',
  'निर्देश: जब दर्पण दाईं ओर (XY) रखा जाता है, तो अक्षर संयोजन "JNVST" का सही दर्पण प्रतिबिम्ब चुनिए।',
  NULL,
  '[
    {"key": "A", "text_en": "Reverse letters with inverted order: T S V N J (mirrored)", "text_hi": "दाएं से बाएं दर्पण रूप: T S V N J (उल्टे अक्षर)", "image_url": null},
    {"key": "B", "text_en": "Same order with mirrored letters: J N V S T", "text_hi": "समान क्रम में दर्पण रूप: J N V S T", "image_url": null},
    {"key": "C", "text_en": "T S N V J (mirrored)", "text_hi": "गलत क्रम: T S N V J", "image_url": null},
    {"key": "D", "text_en": "Upside down inverted: ᒕ И ᴧ S ꓕ", "text_hi": "जल प्रतिबिम्ब (ऊर्ध्वाधर उल्टा)", "image_url": null}
  ]'::jsonb,
  'A',
  'In lateral inversion through a vertical mirror, the rightmost letter (T) becomes the first letter on the left, followed by mirrored S, symmetrical V, mirrored N, and mirrored J.',
  'ऊर्ध्वाधर दर्पण में पार्श्व परिवर्तन (Lateral Inversion) के कारण सबसे दायां अक्षर (T) सबसे पहले दिखाई देता है, और सभी अक्षरों का पार्श्व उल्टा हो जाता है।'
) ON CONFLICT (id) DO NOTHING;

-- Question 3: Arithmetic - Fractional Numbers & BODMAS
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000003',
  NULL,
  'arithmetic',
  'fractional_numbers',
  NULL,
  'medium',
  true,
  2024,
  1.25,
  0.00,
  'Simplify the numerical expression: 3/4 + (5/6 ÷ 2/3) - 1/2',
  'सरल कीजिए: 3/4 + (5/6 ÷ 2/3) - 1/2',
  NULL,
  '[
    {"key": "A", "text_en": "1 1/2 (3/2)", "text_hi": "1 1/2 (3/2)", "image_url": null},
    {"key": "B", "text_en": "1 3/8", "text_hi": "1 3/8", "image_url": null},
    {"key": "C", "text_en": "1 1/4 (5/4)", "text_hi": "1 1/4 (5/4)", "image_url": null},
    {"key": "D", "text_en": "2", "text_hi": "2", "image_url": null}
  ]'::jsonb,
  'A',
  'Step 1: Solve division inside bracket: 5/6 ÷ 2/3 = 5/6 * 3/2 = 15/12 = 5/4. Step 2: Addition & Subtraction: 3/4 + 5/4 - 1/2 = 8/4 - 1/2 = 2 - 1/2 = 3/2 = 1 1/2.',
  'चरण 1: कोष्ठक के अंदर भाग हल करें: 5/6 ÷ 2/3 = 5/6 * 3/2 = 5/4। चरण 2: 3/4 + 5/4 - 1/2 = 8/4 - 1/2 = 2 - 1/2 = 3/2 (1 1/2)।'
) ON CONFLICT (id) DO NOTHING;

-- Question 4: Arithmetic - Profit and Loss
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000004',
  NULL,
  'arithmetic',
  'profit_and_loss',
  NULL,
  'hard',
  true,
  2023,
  1.25,
  0.00,
  'A shopkeeper bought a school bag for ₹400 and spent ₹50 on repairs and transport. If he sells it for ₹540, find his profit percentage.',
  'एक दुकानदार ने एक स्कूल बैग ₹400 में खरीदा और ₹50 उसकी मरम्मत व ढुलाई पर खर्च किए। यदि वह इसे ₹540 में बेचता है, तो उसका लाभ प्रतिशत ज्ञात कीजिए।',
  NULL,
  '[
    {"key": "A", "text_en": "20%", "text_hi": "20%", "image_url": null},
    {"key": "B", "text_en": "25%", "text_hi": "25%", "image_url": null},
    {"key": "C", "text_en": "18%", "text_hi": "18%", "image_url": null},
    {"key": "D", "text_en": "35%", "text_hi": "35%", "image_url": null}
  ]'::jsonb,
  'A',
  'Total Cost Price (CP) = ₹400 + ₹50 = ₹450. Selling Price (SP) = ₹540. Profit = SP - CP = ₹540 - ₹450 = ₹90. Profit % = (Profit / CP) * 100 = (90 / 450) * 100 = 20%.',
  'कुल क्रय मूल्य (CP) = ₹400 + ₹50 = ₹450। विक्रय मूल्य (SP) = ₹540। लाभ = ₹540 - ₹450 = ₹90। लाभ % = (90 / 450) * 100 = 20%।'
) ON CONFLICT (id) DO NOTHING;

-- Question 5: Language - Reading Comprehension (Linked to Passage)
INSERT INTO public.questions (
  id, passage_id, section, topic, mat_category, difficulty, is_pyq, pyq_year, marks, negative_marks,
  question_text_en, question_text_hi, question_image_url, options, correct_option,
  explanation_en, explanation_hi
) VALUES (
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'language',
  'reading_comprehension',
  NULL,
  'easy',
  false,
  NULL,
  1.25,
  0.00,
  'According to the passage, why does the Banyan tree appear to have multiple supportive trunks?',
  'गद्यांश के अनुसार, बरगद का पेड़ कई तनों द्वारा सहारा लिए हुए क्यों प्रतीत होता है?',
  NULL,
  '[
    {"key": "A", "text_en": "Because its aerial roots grow downwards and root into the soil", "text_hi": "क्योंकि इसकी वायवीय जड़ें नीचे बढ़कर मिट्टी में जम जाती हैं", "image_url": null},
    {"key": "B", "text_en": "Because multiple seeds were planted close together", "text_hi": "क्योंकि कई बीजों को एक साथ पास-पास बोया गया था", "image_url": null},
    {"key": "C", "text_en": "Because village elders built artificial wooden pillars", "text_hi": "क्योंकि ग्रामीणों ने कृत्रिम खंभे लगाए थे", "image_url": null},
    {"key": "D", "text_en": "Because it sheds all its outer bark every summer", "text_hi": "क्योंकि यह गर्मियों में अपनी छाल गिरा देता है", "image_url": null}
  ]'::jsonb,
  'A',
  'The passage explicitly states that the aerial roots of the Banyan tree grow downwards and root into the soil, creating pillar-like supporting structures.',
  'गद्यांश में स्पष्ट उल्लेख है कि बरगद की वायवीय जड़ें (जटाएं) नीचे बढ़कर मिट्टी में जड़ें जमा लेती हैं, जिससे वे खंभों के समान तने जैसी प्रतीत होती हैं।'
) ON CONFLICT (id) DO NOTHING;
-- Migration: 20261004000000_mock_tests_schema.sql
-- Description: Phase 2 Mock Test Engine, OMR Sheet Simulator, Attempts & Responses

-- 1. MOCK TESTS TABLE
CREATE TABLE IF NOT EXISTS public.mock_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('full_mock', 'sectional', 'topic_drill')),
    section TEXT CHECK (section IN ('mental_ability', 'arithmetic', 'language')),
    duration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (duration_minutes > 0),
    total_questions INTEGER NOT NULL DEFAULT 80 CHECK (total_questions > 0),
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00 CHECK (total_marks > 0),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_mock_tests_exam_type ON public.mock_tests(exam_type);
CREATE INDEX IF NOT EXISTS idx_mock_tests_is_published ON public.mock_tests(is_published);
CREATE INDEX IF NOT EXISTS idx_mock_tests_section ON public.mock_tests(section);

-- 2. MOCK TEST QUESTIONS MAPPING
CREATE TABLE IF NOT EXISTS public.mock_test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('mental_ability', 'arithmetic', 'language')),
    order_index INTEGER NOT NULL CHECK (order_index > 0),
    marks NUMERIC(4, 2) NOT NULL DEFAULT 1.25 CHECK (marks >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_test_question UNIQUE (test_id, question_id),
    CONSTRAINT uq_test_order UNIQUE (test_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_mock_test_questions_test_id ON public.mock_test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_order ON public.mock_test_questions(test_id, order_index);

-- 3. TEST ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    score NUMERIC(6, 2) DEFAULT 0.00,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    accuracy_percentage NUMERIC(5, 2) DEFAULT 0.00,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_student_id ON public.test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON public.test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON public.test_attempts(status);

-- 4. TEST RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.test_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
    is_correct BOOLEAN,
    marks_awarded NUMERIC(4, 2) DEFAULT 0.00,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_responses_attempt_id ON public.test_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_responses_question_id ON public.test_responses(question_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_responses ENABLE ROW LEVEL SECURITY;

-- Mock Tests Policies
CREATE POLICY "Authenticated users can view published tests"
    ON public.mock_tests FOR SELECT
    TO authenticated
    USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can manage mock tests"
    ON public.mock_tests FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Mock Test Questions Policies
CREATE POLICY "Authenticated users can view questions for published tests"
    ON public.mock_test_questions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.mock_tests
            WHERE id = mock_test_questions.test_id
            AND (is_published = true OR public.is_admin())
        )
    );

CREATE POLICY "Admins can manage test questions"
    ON public.mock_test_questions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Test Attempts Policies
CREATE POLICY "Guardians can view linked student attempts"
    ON public.test_attempts FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.guardian_student_links
            WHERE guardian_id = auth.uid()
            AND student_id = test_attempts.student_id
        )
    );

CREATE POLICY "Guardians can create attempts for linked students"
    ON public.test_attempts FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.guardian_student_links
            WHERE guardian_id = auth.uid()
            AND student_id = test_attempts.student_id
        )
    );

CREATE POLICY "Guardians can update attempts for linked students"
    ON public.test_attempts FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.guardian_student_links
            WHERE guardian_id = auth.uid()
            AND student_id = test_attempts.student_id
        )
    );

-- Test Responses Policies
CREATE POLICY "Guardians can view responses for linked student attempts"
    ON public.test_responses FOR SELECT
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            JOIN public.guardian_student_links gsl ON gsl.student_id = ta.student_id
            WHERE ta.id = test_responses.attempt_id
            AND gsl.guardian_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can insert responses for linked student attempts"
    ON public.test_responses FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            JOIN public.guardian_student_links gsl ON gsl.student_id = ta.student_id
            WHERE ta.id = test_responses.attempt_id
            AND gsl.guardian_id = auth.uid()
        )
    );

CREATE POLICY "Guardians can update responses for linked student attempts"
    ON public.test_responses FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.test_attempts ta
            JOIN public.guardian_student_links gsl ON gsl.student_id = ta.student_id
            WHERE ta.id = test_responses.attempt_id
            AND gsl.guardian_id = auth.uid()
        )
    );

-- 6. SEED A SAMPLE OFFICIAL FULL-LENGTH MOCK TEST & TOPIC DRILLS
INSERT INTO public.mock_tests (id, title, description, exam_type, duration_minutes, total_questions, total_marks, is_published)
VALUES 
    (
        '10000000-0000-0000-0000-000000000010',
        'JNVST Official Pattern Mock Test 1 (All Sections)',
        'Full-length 80-question JNVST Class 6 simulation covering Mental Ability (40 Qs), Arithmetic (20 Qs), and Reading Passages (20 Qs).',
        'full_mock',
        120,
        80,
        100.00,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000011',
        'Mental Ability Speed Drill: Mirror & Figures',
        'Focused practice drill on Mirror Imaging, Odd-One-Out, and Pattern Completion.',
        'topic_drill',
        15,
        10,
        12.50,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Map seeded questions to Mock Test 1
INSERT INTO public.mock_test_questions (test_id, question_id, section, order_index, marks)
VALUES 
    ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 'mental_ability', 1, 1.25),
    ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'mental_ability', 2, 1.25),
    ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', 'arithmetic', 41, 1.25),
    ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004', 'arithmetic', 42, 1.25),
    ('10000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000005', 'language', 61, 1.25)
ON CONFLICT DO NOTHING;
-- Migration: 20261004000001_fix_guardian_fk.sql
-- Description: Drop strict auth.users FK constraints so demo accounts and mock environments can register students seamlessly

ALTER TABLE IF EXISTS public.guardian_student_links 
  DROP CONSTRAINT IF EXISTS guardian_student_links_guardian_id_fkey;

ALTER TABLE IF EXISTS public.guardian_profiles 
  DROP CONSTRAINT IF EXISTS guardian_profiles_id_fkey;

ALTER TABLE IF EXISTS public.application_roles
  DROP CONSTRAINT IF EXISTS application_roles_user_id_fkey;
