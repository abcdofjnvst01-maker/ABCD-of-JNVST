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
