import { createServerSupabaseClient } from "@/server/auth/server";
import { AuditService } from "./AuditService";
import type {
  MockTestRecord,
  MockTestQuestionRecord,
  TestAttemptRecord,
  TestResponseRecord,
  ExamType,
  ExamSection,
  SectionScoreBreakdown,
  OptionKey,
} from "@/server/db/types";

export interface CreateMockTestInput {
  title: string;
  description?: string | null;
  examType: ExamType;
  section?: ExamSection | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  isPublished?: boolean;
  questionIds?: string[];
}

export class MockTestService {
  static async getMockTests(params?: {
    examType?: ExamType;
    section?: ExamSection;
    isPublishedOnly?: boolean;
  }): Promise<MockTestRecord[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("mock_tests").select("*").order("created_at", { ascending: false });

    if (params?.examType) {
      query = query.eq("exam_type", params.examType);
    }
    if (params?.section) {
      query = query.eq("section", params.section);
    }
    if (params?.isPublishedOnly) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[MockTestService] Error fetching tests:", error.message);
      return [];
    }
    return (data || []) as unknown as MockTestRecord[];
  }

  static async getMockTestById(id: string): Promise<MockTestRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mock_tests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as unknown as MockTestRecord;
  }

  static async getMockTestQuestions(testId: string): Promise<MockTestQuestionRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mock_test_questions")
      .select(`
        *,
        question:questions (
          *,
          passage:passages (*)
        )
      `)
      .eq("test_id", testId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[MockTestService] Error fetching test questions:", error.message);
      return [];
    }
    return (data || []) as unknown as MockTestQuestionRecord[];
  }

  static async createMockTest(
    input: CreateMockTestInput,
    actorId?: string,
    ipAddress?: string | null
  ): Promise<{ success: boolean; testId?: string; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const testId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error: testError } = await (supabase.from("mock_tests") as any).insert({
      id: testId,
      title: input.title,
      description: input.description || null,
      exam_type: input.examType,
      section: input.section || null,
      duration_minutes: input.durationMinutes,
      total_questions: input.totalQuestions,
      total_marks: input.totalMarks,
      is_published: input.isPublished ?? false,
      created_at: now,
      updated_at: now,
    });

    if (testError) {
      return { success: false, error: `Failed to create test: ${testError.message}` };
    }

    if (input.questionIds && input.questionIds.length > 0) {
      const mappings = input.questionIds.map((qId, idx) => ({
        id: crypto.randomUUID(),
        test_id: testId,
        question_id: qId,
        section: input.section || "mental_ability",
        order_index: idx + 1,
        marks: 1.25,
        created_at: now,
      }));

      const { error: mapError } = await (supabase.from("mock_test_questions") as any).insert(
        mappings
      );
      if (mapError) {
        console.error("[MockTestService] Error inserting question mappings:", mapError.message);
      }
    }

    await AuditService.log({
      actorId,
      actorRole: "admin",
      action: "MOCK_TEST_CREATED",
      resourceType: "mock_tests",
      resourceId: testId,
      metadata: { title: input.title, examType: input.examType },
      ipAddress,
    });

    return { success: true, testId };
  }

  static async startAttempt(
    studentId: string,
    testId: string,
    actorId?: string,
    ipAddress?: string | null
  ): Promise<{ success: boolean; attemptId?: string; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const test = await this.getMockTestById(testId);
    if (!test) {
      return { success: false, error: "Test not found." };
    }

    // Check if an in_progress attempt already exists
    const { data: existing } = await (supabase.from("test_attempts") as any)
      .select("id")
      .eq("student_id", studentId)
      .eq("test_id", testId)
      .eq("status", "in_progress")
      .maybeSingle();

    if (existing && (existing as { id: string }).id) {
      return { success: true, attemptId: (existing as { id: string }).id };
    }

    const attemptId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await (supabase.from("test_attempts") as any).insert({
      id: attemptId,
      student_id: studentId,
      test_id: testId,
      status: "in_progress",
      started_at: now,
      total_marks: test.total_marks,
      score: 0,
      accuracy_percentage: 0,
      time_spent_seconds: 0,
      section_scores: {},
      created_at: now,
      updated_at: now,
    });

    if (error) {
      return { success: false, error: `Failed to start attempt: ${error.message}` };
    }

    await AuditService.log({
      actorId: actorId || studentId,
      actorRole: "guardian",
      action: "TEST_ATTEMPT_STARTED",
      resourceType: "test_attempts",
      resourceId: attemptId,
      metadata: { testId, studentId },
      ipAddress,
    });

    return { success: true, attemptId };
  }

  static async getAttemptById(attemptId: string): Promise<TestAttemptRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("test_attempts")
      .select(`
        *,
        student:student_profiles (*),
        test:mock_tests (*)
      `)
      .eq("id", attemptId)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as TestAttemptRecord;
  }

  static async getAttemptResponses(attemptId: string): Promise<TestResponseRecord[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("test_responses")
      .select(`
        *,
        question:questions (
          *,
          passage:passages (*)
        )
      `)
      .eq("attempt_id", attemptId);

    if (error) {
      console.error("[MockTestService] Error fetching responses:", error.message);
      return [];
    }
    return (data || []) as unknown as TestResponseRecord[];
  }

  static async saveResponse(params: {
    attemptId: string;
    questionId: string;
    selectedOption: OptionKey | null;
    isMarkedForReview?: boolean;
    timeSpentSeconds?: number;
  }): Promise<{ success: boolean; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await (supabase.from("test_responses") as any).upsert(
      {
        attempt_id: params.attemptId,
        question_id: params.questionId,
        selected_option: params.selectedOption,
        is_marked_for_review: params.isMarkedForReview ?? false,
        time_spent_seconds: params.timeSpentSeconds ?? 0,
        updated_at: now,
      },
      { onConflict: "attempt_id,question_id" }
    );

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  static async submitAttempt(
    attemptId: string,
    timeSpentSeconds: number,
    actorId?: string,
    ipAddress?: string | null
  ): Promise<{ success: boolean; result?: TestAttemptRecord; error?: string }> {
    const supabase = await createServerSupabaseClient();
    const attempt = await this.getAttemptById(attemptId);
    if (!attempt) {
      return { success: false, error: "Attempt not found." };
    }

    const testQuestions = await this.getMockTestQuestions(attempt.test_id);
    const responses = await this.getAttemptResponses(attemptId);
    const responseMap = new Map<string, TestResponseRecord>();
    responses.forEach((r) => responseMap.set(r.question_id, r));

    let totalScore = 0;
    let correctTotal = 0;
    let attemptedTotal = 0;

    const sectionBreakdown: Record<ExamSection, SectionScoreBreakdown> = {
      mental_ability: {
        score: 0,
        total_marks: 0,
        questions_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        unattempted_count: 0,
      },
      arithmetic: {
        score: 0,
        total_marks: 0,
        questions_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        unattempted_count: 0,
      },
      language: {
        score: 0,
        total_marks: 0,
        questions_count: 0,
        correct_count: 0,
        incorrect_count: 0,
        unattempted_count: 0,
      },
    };

    const responseUpdates: any[] = [];

    for (const item of testQuestions) {
      const q = item.question;
      if (!q) continue;

      const sec = item.section as ExamSection;
      sectionBreakdown[sec].questions_count += 1;
      sectionBreakdown[sec].total_marks += Number(item.marks || 1.25);

      const resp = responseMap.get(item.question_id);
      const isAttempted = resp && resp.selected_option !== null;

      if (isAttempted) {
        attemptedTotal += 1;
        const isCorrect = resp.selected_option === q.correct_option;
        const marksAwarded = isCorrect ? Number(item.marks || 1.25) : 0;

        if (isCorrect) {
          correctTotal += 1;
          totalScore += marksAwarded;
          sectionBreakdown[sec].correct_count += 1;
          sectionBreakdown[sec].score += marksAwarded;
        } else {
          sectionBreakdown[sec].incorrect_count += 1;
        }

        responseUpdates.push({
          id: resp.id,
          attempt_id: attemptId,
          question_id: item.question_id,
          selected_option: resp.selected_option,
          is_marked_for_review: resp.is_marked_for_review,
          is_correct: isCorrect,
          marks_awarded: marksAwarded,
          time_spent_seconds: resp.time_spent_seconds || 0,
          updated_at: new Date().toISOString(),
        });
      } else {
        sectionBreakdown[sec].unattempted_count += 1;
      }
    }

    // Bulk update responses with correctness & marks
    if (responseUpdates.length > 0) {
      await (supabase.from("test_responses") as any).upsert(responseUpdates, {
        onConflict: "attempt_id,question_id",
      });
    }

    const accuracy =
      attemptedTotal > 0 ? Number(((correctTotal / attemptedTotal) * 100).toFixed(2)) : 0;
    const now = new Date().toISOString();

    const { data: updatedAttempt, error: updateError } = await (
      supabase.from("test_attempts") as any
    )
      .update({
        status: "completed",
        completed_at: now,
        score: Number(totalScore.toFixed(2)),
        accuracy_percentage: accuracy,
        time_spent_seconds: timeSpentSeconds,
        section_scores: sectionBreakdown,
        updated_at: now,
      })
      .eq("id", attemptId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Failed to complete attempt: ${updateError.message}` };
    }

    await AuditService.log({
      actorId: actorId || attempt.student_id,
      actorRole: "guardian",
      action: "TEST_ATTEMPT_COMPLETED",
      resourceType: "test_attempts",
      resourceId: attemptId,
      metadata: { score: totalScore, accuracy, timeSpentSeconds },
      ipAddress,
    });

    return { success: true, result: updatedAttempt as unknown as TestAttemptRecord };
  }
}
