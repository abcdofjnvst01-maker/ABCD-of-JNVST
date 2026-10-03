import React from "react";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/server/auth/server";
import { MockTestService } from "@/server/services/MockTestService";
import { TestScorecard } from "@/features/tests/components/TestScorecard";

interface ResultPageProps {
  params: Promise<{ testId: string; attemptId: string }>;
}

export default async function TestResultPage({ params }: ResultPageProps) {
  const { testId, attemptId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signin?redirect=/tests/${testId}/attempt/${attemptId}/result`);
  }

  const attempt = await MockTestService.getAttemptById(attemptId);
  const testQuestions = await MockTestService.getMockTestQuestions(testId);
  const responses = await MockTestService.getAttemptResponses(attemptId);

  if (!attempt) {
    notFound();
  }

  return (
    <TestScorecard
      attempt={attempt}
      testQuestions={testQuestions}
      responses={responses}
    />
  );
}
