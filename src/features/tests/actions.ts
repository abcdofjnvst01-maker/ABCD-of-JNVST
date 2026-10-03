"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/server/auth/server";
import { MockTestService } from "@/server/services/MockTestService";
import type { OptionKey, ExamType, ExamSection } from "@/server/db/types";

export interface TestActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function startTestAttemptAction(
  studentId: string,
  testId: string
): Promise<TestActionResult<{ attemptId: string }>> {
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const res = await MockTestService.startAttempt(studentId, testId, user?.id, ipAddress);
  if (!res.success || !res.attemptId) {
    return { success: false, error: res.error || "Could not start test attempt." };
  }

  revalidatePath(`/tests/${testId}`);
  return { success: true, data: { attemptId: res.attemptId } };
}

export async function saveTestResponseAction(params: {
  attemptId: string;
  questionId: string;
  selectedOption: OptionKey | null;
  isMarkedForReview?: boolean;
  timeSpentSeconds?: number;
}): Promise<TestActionResult<null>> {
  const res = await MockTestService.saveResponse(params);
  if (!res.success) {
    return { success: false, error: res.error || "Failed to save response." };
  }
  return { success: true };
}

export async function submitTestAttemptAction(
  attemptId: string,
  timeSpentSeconds: number
): Promise<TestActionResult<{ attemptId: string; score: number }>> {
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const res = await MockTestService.submitAttempt(
    attemptId,
    timeSpentSeconds,
    user?.id,
    ipAddress
  );

  if (!res.success || !res.result) {
    return { success: false, error: res.error || "Failed to submit test." };
  }

  revalidatePath(`/tests`);
  return {
    success: true,
    data: { attemptId: res.result.id, score: Number(res.result.score) },
  };
}

export async function createMockTestAction(input: {
  title: string;
  description?: string;
  examType: ExamType;
  section?: ExamSection;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  isPublished?: boolean;
  questionIds?: string[];
}): Promise<TestActionResult<{ testId: string }>> {
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const res = await MockTestService.createMockTest(input, user?.id, ipAddress);
  if (!res.success || !res.testId) {
    return { success: false, error: res.error || "Failed to create mock test." };
  }

  revalidatePath("/admin/tests");
  revalidatePath("/tests");
  return { success: true, data: { testId: res.testId } };
}
