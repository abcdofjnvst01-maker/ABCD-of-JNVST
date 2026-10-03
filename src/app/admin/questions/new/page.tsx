import { requireAdmin } from "@/server/authorization";
import { QuestionService } from "@/server/services/QuestionService";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Question | ABCD of JNVST",
  description: "Create bilingual question for JNVST Class 6 exam.",
};

export default async function NewQuestionPage() {
  await requireAdmin();
  const passages = await QuestionService.getPassages();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <QuestionForm passages={passages} />
    </div>
  );
}
