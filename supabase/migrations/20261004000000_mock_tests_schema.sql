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
