import React from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/authorization";
import { MockTestService } from "@/server/services/MockTestService";
import { TestScorecard } from "@/features/tests/components/TestScorecard";

interface ResultPageProps {
  params: Promise<{ testId: string; attemptId: string }>;
}

export default async function TestResultPage({ params }: ResultPageProps) {
  const { testId, attemptId } = await params;
  await requireUser();

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
