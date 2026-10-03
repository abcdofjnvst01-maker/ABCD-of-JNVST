"use client";

import { useState } from "react";
import type { QuestionRecord, PassageRecord } from "@/server/db/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  X,
  Languages,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";

interface QuestionPreviewModalProps {
  question: QuestionRecord | null;
  passage?: PassageRecord | null;
  onClose: () => void;
}

export function QuestionPreviewModal({
  question,
  passage,
  onClose,
}: QuestionPreviewModalProps) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!question) return null;

  const qText = lang === "en" ? question.question_text_en : question.question_text_hi;
  const explanation = lang === "en" ? question.explanation_en : question.explanation_hi;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900">Bilingual Question Preview</span>
            <Badge variant="brand" className="uppercase">
              {question.section.replace("_", " ")}
            </Badge>
            {question.is_pyq && (
              <Badge variant="accent">PYQ {question.pyq_year || "JNVST"}</Badge>
            )}
            <Badge
              variant={
                question.difficulty === "easy"
                  ? "success"
                  : question.difficulty === "hard"
                    ? "danger"
                    : "warning"
              }
            >
              {question.difficulty.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "en" ? "हिन्दी में देखें" : "View in English"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-slate-800">
          {/* Linked Passage if applicable */}
          {passage && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <div className="mb-2 flex items-center gap-2 font-bold text-indigo-950">
                <BookOpen className="h-4 w-4 text-indigo-700" />
                <span>
                  {lang === "en"
                    ? passage.title_en || "Reading Comprehension Passage"
                    : passage.title_hi || "गद्यांश"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                {lang === "en" ? passage.content_en : passage.content_hi}
              </p>
            </div>
          )}

          {/* Question Prompt */}
          <div className="space-y-3">
            <div className="text-sm font-semibold leading-relaxed text-slate-900">
              {qText || (
                <span className="italic text-slate-400">
                  (No {lang === "en" ? "English" : "Hindi"} text provided)
                </span>
              )}
            </div>

            {/* Problem Figure / Diagram */}
            {question.question_image_url && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
                <img
                  src={question.question_image_url}
                  alt="Problem Figure"
                  className="mx-auto max-h-48 rounded object-contain"
                />
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((opt) => {
              const optText = lang === "en" ? opt.text_en : opt.text_hi;
              const isSelected = selectedOption === opt.key;
              const isCorrect = opt.key === question.correct_option;

              let btnStyle =
                "border-slate-200 bg-white hover:border-teal-600 hover:bg-teal-50/40";
              if (showExplanation) {
                if (isCorrect) {
                  btnStyle =
                    "border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "border-rose-300 bg-rose-50 text-rose-900";
                }
              } else if (isSelected) {
                btnStyle =
                  "border-teal-700 bg-teal-50/70 text-teal-950 ring-2 ring-teal-700";
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedOption(opt.key)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${btnStyle}`}
                >
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCorrect && showExplanation
                        ? "bg-emerald-600 text-white"
                        : isSelected
                          ? "bg-teal-800 text-white"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.key}
                  </span>

                  <div className="flex-1 space-y-1">
                    {optText && <p className="text-xs font-medium">{optText}</p>}
                    {opt.image_url && (
                      <img
                        src={opt.image_url}
                        alt={`Option ${opt.key}`}
                        className="max-h-24 rounded border border-slate-200 bg-white object-contain p-1"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation Section */}
          {showExplanation ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Correct Answer: Option <strong>{question.correct_option}</strong>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                {explanation || "Detailed step-by-step solution key is configured."}
              </p>
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExplanation(true)}
                className="gap-1 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Check Correct Answer &
                Solution
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Standard JNVST Weightage: {question.marks} Marks</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
