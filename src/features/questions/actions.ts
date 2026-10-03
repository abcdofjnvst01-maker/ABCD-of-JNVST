"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/server/authorization";
import { QuestionService } from "@/server/services/QuestionService";
import {
  questionSchema,
  passageSchema,
  bulkImportSchema,
  type QuestionInput,
} from "@/server/validation/question";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createQuestionAction(
  rawData: unknown
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const parsed = questionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please fix the validation errors in the question form.",
    };
  }

  const result = await QuestionService.createQuestion({
    input: parsed.data,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success || !result.question) {
    return {
      success: false,
      error: result.error || "Failed to create question.",
    };
  }

  revalidatePath("/admin/questions");
  return { success: true, data: { id: result.question.id } };
}

export async function updateQuestionAction(
  id: string,
  rawData: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const parsed = questionSchema.partial().safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please fix the validation errors.",
    };
  }

  const result = await QuestionService.updateQuestion({
    id,
    input: parsed.data,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to update question.",
    };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function deleteQuestionAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const result = await QuestionService.deleteQuestion({
    id,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to delete question.",
    };
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function createPassageAction(
  rawData: unknown
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const parsed = passageSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please fix the validation errors in the passage.",
    };
  }

  const result = await QuestionService.createPassage({
    input: parsed.data,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success || !result.passage) {
    return {
      success: false,
      error: result.error || "Failed to create passage.",
    };
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin/passages");
  return { success: true, data: { id: result.passage.id } };
}

export async function deletePassageAction(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const result = await QuestionService.deletePassage({
    id,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to delete passage.",
    };
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin/passages");
  return { success: true };
}

export async function bulkImportQuestionsAction(
  rawData: unknown
): Promise<ActionResult<{ count: number }>> {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const parsed = bulkImportSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Invalid JSON format or missing required question fields.",
    };
  }

  const result = await QuestionService.bulkImportQuestions({
    items: parsed.data.questions,
    adminId: admin.id,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.errors?.[0] || "Failed to bulk import questions.",
    };
  }

  revalidatePath("/admin/questions");
  return { success: true, data: { count: result.importedCount } };
}
