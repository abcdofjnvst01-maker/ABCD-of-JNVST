import { requireAdmin } from "@/server/authorization";
import { QuestionService } from "@/server/services/QuestionService";
import { QuestionListTable } from "@/features/questions/components/QuestionListTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question Bank & Content Manager | ABCD of JNVST",
  description: "Author and manage bilingual questions for JNVST Class 6 exam.",
};

export default async function AdminQuestionsPage() {
  await requireAdmin();
  const questions = await QuestionService.getQuestions({ limit: 500 });
  const passages = await QuestionService.getPassages();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <QuestionListTable questions={questions} passages={passages} />
    </div>
  );
}
