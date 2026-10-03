export type ApplicationRole = "admin" | "guardian";

export type GuardianRelationship = "parent" | "guardian" | "teacher" | "other";

export type EntitlementStatus = "active" | "expired" | "cancelled" | "pending";

export type Gender = "male" | "female" | "other";

export type ExamSection = "mental_ability" | "arithmetic" | "language";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type OptionKey = "A" | "B" | "C" | "D";

export type MATCategory =
  | "odd_man_out"
  | "figure_matching"
  | "pattern_completion"
  | "figure_series_completion"
  | "analogy"
  | "geometrical_figure_completion"
  | "mirror_imaging"
  | "punched_hole_pattern"
  | "space_visualization"
  | "embedded_figure";

export interface QuestionOption {
  key: OptionKey;
  text_en?: string;
  text_hi?: string;
  image_url?: string | null;
}

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ApplicationRoleRecord {
  id: string;
  user_id: string;
  role: ApplicationRole;
  created_at: string;
}

export interface GuardianProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileRecord {
  id: string;
  full_name: string;
  date_of_birth: string;
  district: string;
  state: string;
  gender: Gender | null;
  target_exam_year: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface GuardianStudentLinkRecord {
  id: string;
  guardian_id: string;
  student_id: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
  created_at: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  price_inr: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentEntitlementRecord {
  id: string;
  student_id: string;
  plan_id: string;
  status: EntitlementStatus;
  starts_at: string;
  expires_at: string;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface PassageRecord {
  id: string;
  title_en: string | null;
  title_hi: string | null;
  content_en: string | null;
  content_hi: string | null;
  language_code: "en" | "hi" | "both";
  created_at: string;
  updated_at: string;
}

export interface QuestionRecord {
  id: string;
  passage_id: string | null;
  section: ExamSection;
  topic: string;
  mat_category: MATCategory | null;
  difficulty: DifficultyLevel;
  is_pyq: boolean;
  pyq_year: number | null;
  marks: number;
  negative_marks: number;
  question_text_en: string | null;
  question_text_hi: string | null;
  question_image_url: string | null;
  options: QuestionOption[];
  correct_option: OptionKey;
  explanation_en: string | null;
  explanation_hi: string | null;
  explanation_image_url: string | null;
  passage?: PassageRecord | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExamType = "full_mock" | "sectional" | "topic_drill";
export type TestStatus = "in_progress" | "completed" | "abandoned" | "timed_out";

export interface MockTestRecord {
  id: string;
  title: string;
  description: string | null;
  exam_type: ExamType;
  section: ExamSection | null;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockTestQuestionRecord {
  id: string;
  test_id: string;
  question_id: string;
  section: ExamSection;
  order_index: number;
  marks: number;
  created_at: string;
  // Joined relation fields
  question?: QuestionRecord;
}

export interface SectionScoreBreakdown {
  score: number;
  total_marks: number;
  questions_count: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
}

export interface TestAttemptRecord {
  id: string;
  student_id: string;
  test_id: string;
  status: TestStatus;
  started_at: string;
  completed_at: string | null;
  score: number;
  total_marks: number;
  accuracy_percentage: number;
  time_spent_seconds: number;
  section_scores: Record<ExamSection, SectionScoreBreakdown>;
  created_at: string;
  updated_at: string;
  // Joined relations
  student?: StudentProfileRecord;
  test?: MockTestRecord;
}

export interface TestResponseRecord {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: OptionKey | null;
  is_marked_for_review: boolean;
  is_correct: boolean | null;
  marks_awarded: number;
  time_spent_seconds: number;
  created_at: string;
  updated_at: string;
  // Joined relation
  question?: QuestionRecord;
}

export interface Database {
  public: {
    Tables: {
      application_roles: {
        Row: ApplicationRoleRecord;
        Insert: Omit<ApplicationRoleRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ApplicationRoleRecord>;
        Relationships: [];
      };
      guardian_profiles: {
        Row: GuardianProfileRecord;
        Insert: Omit<GuardianProfileRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<GuardianProfileRecord>;
        Relationships: [];
      };
      student_profiles: {
        Row: StudentProfileRecord;
        Insert: Omit<StudentProfileRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StudentProfileRecord>;
        Relationships: [];
      };
      guardian_student_links: {
        Row: GuardianStudentLinkRecord;
        Insert: Omit<GuardianStudentLinkRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<GuardianStudentLinkRecord>;
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlanRecord;
        Insert: Omit<SubscriptionPlanRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SubscriptionPlanRecord>;
        Relationships: [];
      };
      student_entitlements: {
        Row: StudentEntitlementRecord;
        Insert: Omit<StudentEntitlementRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StudentEntitlementRecord>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRecord;
        Insert: Omit<AuditLogRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLogRecord>;
        Relationships: [];
      };
      passages: {
        Row: PassageRecord;
        Insert: Omit<PassageRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PassageRecord>;
        Relationships: [];
      };
      questions: {
        Row: QuestionRecord;
        Insert: Omit<QuestionRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<QuestionRecord>;
        Relationships: [];
      };
      mock_tests: {
        Row: MockTestRecord;
        Insert: Omit<MockTestRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<MockTestRecord>;
        Relationships: [];
      };
      mock_test_questions: {
        Row: MockTestQuestionRecord;
        Insert: Omit<MockTestQuestionRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MockTestQuestionRecord>;
        Relationships: [];
      };
      test_attempts: {
        Row: TestAttemptRecord;
        Insert: Omit<TestAttemptRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TestAttemptRecord>;
        Relationships: [];
      };
      test_responses: {
        Row: TestResponseRecord;
        Insert: Omit<TestResponseRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TestResponseRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
