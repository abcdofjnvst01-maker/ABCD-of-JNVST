import { createServerSupabaseClient } from "@/server/auth/server";
import { AuditService } from "./AuditService";
import type {
  QuestionRecord,
  PassageRecord,
  ExamSection,
  MATCategory,
  DifficultyLevel,
  QuestionOption,
} from "@/server/db/types";
import type {
  QuestionInput,
  PassageInput,
  BulkImportQuestionItem,
} from "@/server/validation/question";

export interface QuestionFilterParams {
  section?: ExamSection;
  topic?: string;
  matCategory?: MATCategory;
  difficulty?: DifficultyLevel;
  isPyq?: boolean;
  pyqYear?: number;
  passageId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionBankStats {
  totalQuestions: number;
  matQuestions: number;
  arithmeticQuestions: number;
  languageQuestions: number;
  pyqQuestions: number;
  totalPassages: number;
  byDifficulty: Record<DifficultyLevel, number>;
}

export class QuestionService {
  static async getQuestions(
    params: QuestionFilterParams = {}
  ): Promise<QuestionRecord[]> {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (params.section) {
        query = query.eq("section", params.section);
      }
      if (params.topic) {
        query = query.eq("topic", params.topic);
      }
      if (params.matCategory) {
        query = query.eq("mat_category", params.matCategory);
      }
      if (params.difficulty) {
        query = query.eq("difficulty", params.difficulty);
      }
      if (params.isPyq !== undefined) {
        query = query.eq("is_pyq", params.isPyq);
      }
      if (params.pyqYear) {
        query = query.eq("pyq_year", params.pyqYear);
      }
      if (params.passageId) {
        query = query.eq("passage_id", params.passageId);
      }
      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error("[QuestionService] Error fetching questions:", error.message);
        return [];
      }

      let questions = (data as unknown as QuestionRecord[]) || [];

      // Local keyword filter if provided
      if (params.search && params.search.trim()) {
        const searchLower = params.search.toLowerCase();
        questions = questions.filter(
          (q) =>
            q.topic.toLowerCase().includes(searchLower) ||
            q.question_text_en?.toLowerCase().includes(searchLower) ||
            q.question_text_hi?.includes(searchLower)
        );
      }

      return questions;
    } catch (err: any) {
      console.error("[QuestionService] getQuestions failed:", err?.message || err);
      return [];
    }
  }

  static async getQuestionById(id: string): Promise<QuestionRecord | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[QuestionService] Error fetching question:", error.message);
        return null;
      }

      if (!data) return null;
      return data as unknown as QuestionRecord;
    } catch (err: any) {
      console.error("[QuestionService] getQuestionById failed:", err?.message || err);
      return null;
    }
  }

  static async createQuestion(params: {
    input: QuestionInput;
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; question?: QuestionRecord; error?: string }> {
    const questionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id: questionId,
      passage_id: params.input.passageId || null,
      section: params.input.section,
      topic: params.input.topic,
      mat_category: params.input.matCategory || null,
      difficulty: params.input.difficulty,
      is_pyq: params.input.isPyq,
      pyq_year: params.input.pyqYear || null,
      marks: params.input.marks,
      negative_marks: params.input.negativeMarks,
      question_text_en: params.input.questionTextEn || null,
      question_text_hi: params.input.questionTextHi || null,
      question_image_url: params.input.questionImageUrl || null,
      options: params.input.options,
      correct_option: params.input.correctOption,
      explanation_en: params.input.explanationEn || null,
      explanation_hi: params.input.explanationHi || null,
      explanation_image_url: params.input.explanationImageUrl || null,
      is_active: params.input.isActive,
      created_at: now,
      updated_at: now,
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("questions") as any).insert(record);

      if (error) {
        return {
          success: false,
          error: `Failed to create question: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "QUESTION_CREATED",
        resourceType: "questions",
        resourceId: questionId,
        metadata: {
          section: params.input.section,
          topic: params.input.topic,
          difficulty: params.input.difficulty,
          isPyq: params.input.isPyq,
        },
        ipAddress: params.ipAddress,
      });

      return { success: true, question: record as unknown as QuestionRecord };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async updateQuestion(params: {
    id: string;
    input: Partial<QuestionInput>;
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      updated_at: now,
    };

    if (params.input.passageId !== undefined)
      updateData.passage_id = params.input.passageId;
    if (params.input.section !== undefined) updateData.section = params.input.section;
    if (params.input.topic !== undefined) updateData.topic = params.input.topic;
    if (params.input.matCategory !== undefined)
      updateData.mat_category = params.input.matCategory;
    if (params.input.difficulty !== undefined)
      updateData.difficulty = params.input.difficulty;
    if (params.input.isPyq !== undefined) updateData.is_pyq = params.input.isPyq;
    if (params.input.pyqYear !== undefined) updateData.pyq_year = params.input.pyqYear;
    if (params.input.marks !== undefined) updateData.marks = params.input.marks;
    if (params.input.negativeMarks !== undefined)
      updateData.negative_marks = params.input.negativeMarks;
    if (params.input.questionTextEn !== undefined)
      updateData.question_text_en = params.input.questionTextEn;
    if (params.input.questionTextHi !== undefined)
      updateData.question_text_hi = params.input.questionTextHi;
    if (params.input.questionImageUrl !== undefined)
      updateData.question_image_url = params.input.questionImageUrl;
    if (params.input.options !== undefined) updateData.options = params.input.options;
    if (params.input.correctOption !== undefined)
      updateData.correct_option = params.input.correctOption;
    if (params.input.explanationEn !== undefined)
      updateData.explanation_en = params.input.explanationEn;
    if (params.input.explanationHi !== undefined)
      updateData.explanation_hi = params.input.explanationHi;
    if (params.input.explanationImageUrl !== undefined)
      updateData.explanation_image_url = params.input.explanationImageUrl;
    if (params.input.isActive !== undefined) updateData.is_active = params.input.isActive;

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("questions") as any)
        .update(updateData)
        .eq("id", params.id);

      if (error) {
        return {
          success: false,
          error: `Failed to update question: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "QUESTION_UPDATED",
        resourceType: "questions",
        resourceId: params.id,
        metadata: updateData,
        ipAddress: params.ipAddress,
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async deleteQuestion(params: {
    id: string;
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.from("questions").delete().eq("id", params.id);

      if (error) {
        return {
          success: false,
          error: `Failed to delete question: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "QUESTION_DELETED",
        resourceType: "questions",
        resourceId: params.id,
        ipAddress: params.ipAddress,
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async getPassages(): Promise<PassageRecord[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("passages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[QuestionService] Error fetching passages:", error.message);
        return [];
      }

      return (data as PassageRecord[]) || [];
    } catch (err: any) {
      console.error("[QuestionService] getPassages failed:", err?.message || err);
      return [];
    }
  }

  static async getPassageById(id: string): Promise<PassageRecord | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("passages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;
      return data as PassageRecord;
    } catch {
      return null;
    }
  }

  static async createPassage(params: {
    input: PassageInput;
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; passage?: PassageRecord; error?: string }> {
    const passageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: PassageRecord = {
      id: passageId,
      title_en: params.input.titleEn || null,
      title_hi: params.input.titleHi || null,
      content_en: params.input.contentEn || null,
      content_hi: params.input.contentHi || null,
      language_code: params.input.languageCode,
      created_at: now,
      updated_at: now,
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("passages") as any).insert(record);

      if (error) {
        return {
          success: false,
          error: `Failed to create passage: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "PASSAGE_CREATED",
        resourceType: "passages",
        resourceId: passageId,
        metadata: {
          titleEn: params.input.titleEn,
          languageCode: params.input.languageCode,
        },
        ipAddress: params.ipAddress,
      });

      return { success: true, passage: record };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async deletePassage(params: {
    id: string;
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.from("passages").delete().eq("id", params.id);

      if (error) {
        return {
          success: false,
          error: `Failed to delete passage: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "PASSAGE_DELETED",
        resourceType: "passages",
        resourceId: params.id,
        ipAddress: params.ipAddress,
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async bulkImportQuestions(params: {
    items: BulkImportQuestionItem[];
    adminId: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; importedCount: number; errors?: string[] }> {
    const now = new Date().toISOString();
    const rowsToInsert = params.items.map((item) => ({
      id: crypto.randomUUID(),
      passage_id: null,
      section: item.section,
      topic: item.topic,
      mat_category: (item.mat_category as MATCategory) || null,
      difficulty: item.difficulty || "medium",
      is_pyq: item.is_pyq || false,
      pyq_year: item.pyq_year || null,
      marks: 1.25,
      negative_marks: 0.0,
      question_text_en: item.question_text_en || null,
      question_text_hi: item.question_text_hi || null,
      question_image_url: item.question_image_url || null,
      options: item.options,
      correct_option: item.correct_option,
      explanation_en: item.explanation_en || null,
      explanation_hi: item.explanation_hi || null,
      explanation_image_url: item.explanation_image_url || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("questions") as any).insert(rowsToInsert);

      if (error) {
        return {
          success: false,
          importedCount: 0,
          errors: [error.message],
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "QUESTIONS_BULK_IMPORTED",
        resourceType: "questions",
        metadata: {
          count: rowsToInsert.length,
          sections: [...new Set(rowsToInsert.map((r) => r.section))],
        },
        ipAddress: params.ipAddress,
      });

      return {
        success: true,
        importedCount: rowsToInsert.length,
      };
    } catch (err: any) {
      return {
        success: false,
        importedCount: 0,
        errors: [err?.message || "Database connection error"],
      };
    }
  }

  static async getQuestionBankStats(): Promise<QuestionBankStats> {
    try {
      const questions = await this.getQuestions({ limit: 1000 });
      const passages = await this.getPassages();

      const stats: QuestionBankStats = {
        totalQuestions: questions.length,
        matQuestions: 0,
        arithmeticQuestions: 0,
        languageQuestions: 0,
        pyqQuestions: 0,
        totalPassages: passages.length,
        byDifficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
      };

      for (const q of questions) {
        if (q.section === "mental_ability") stats.matQuestions++;
        if (q.section === "arithmetic") stats.arithmeticQuestions++;
        if (q.section === "language") stats.languageQuestions++;
        if (q.is_pyq) stats.pyqQuestions++;
        if (q.difficulty in stats.byDifficulty) {
          stats.byDifficulty[q.difficulty]++;
        }
      }

      return stats;
    } catch {
      return {
        totalQuestions: 0,
        matQuestions: 0,
        arithmeticQuestions: 0,
        languageQuestions: 0,
        pyqQuestions: 0,
        totalPassages: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
      };
    }
  }
}
