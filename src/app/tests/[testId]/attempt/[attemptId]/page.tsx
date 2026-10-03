import React from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/server/auth/server";
import { MockTestService } from "@/server/services/MockTestService";
import { TestTakingInterface } from "@/features/tests/components/TestTakingInterface";

interface AttemptPageProps {
  params: Promise<{ testId: string; attemptId: string }>;
}

export default async function TestAttemptLivePage({ params }: AttemptPageProps) {
  const { testId, attemptId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signin?redirect=/tests/${testId}/attempt/${attemptId}`);
  }

  const test = await MockTestService.getMockTestById(testId);
  const attempt = await MockTestService.getAttemptById(attemptId);
  const testQuestions = await MockTestService.getMockTestQuestions(testId);
  const initialResponses = await MockTestService.getAttemptResponses(attemptId);

  if (!test || !attempt) {
    notFound();
  }

  // If already completed, redirect to scorecard
  if (attempt.status === "completed") {
    redirect(`/tests/${testId}/attempt/${attemptId}/result`);
  }

  return (
    <TestTakingInterface
      test={test}
      attempt={attempt}
      testQuestions={testQuestions}
      initialResponses={initialResponses}
    />
  );
}
