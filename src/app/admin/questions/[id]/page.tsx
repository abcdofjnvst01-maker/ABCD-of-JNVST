import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/authorization";
import { QuestionService } from "@/server/services/QuestionService";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Question | ABCD of JNVST",
  description: "Update bilingual question details.",
};

interface EditQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  await requireAdmin();
  const { id } = await params;
  const question = await QuestionService.getQuestionById(id);
  const passages = await QuestionService.getPassages();

  if (!question) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <QuestionForm initialQuestion={question} passages={passages} />
    </div>
  );
}
