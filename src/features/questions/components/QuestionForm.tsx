"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  QuestionRecord,
  PassageRecord,
  ExamSection,
  MATCategory,
  DifficultyLevel,
  OptionKey,
  QuestionOption,
} from "@/server/db/types";
import {
  JNVST_SECTIONS,
  JNVST_MAT_CATEGORIES,
  JNVST_ARITHMETIC_TOPICS,
  JNVST_LANGUAGE_TOPICS,
  DIFFICULTY_LEVELS,
} from "@/lib/constants";
import { createQuestionAction, updateQuestionAction } from "@/features/questions/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import {
  Languages,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  Eye,
  BookOpen,
  ArrowLeft,
  Save,
} from "lucide-react";
import Link from "next/link";

interface QuestionFormProps {
  initialQuestion?: QuestionRecord | null;
  passages?: PassageRecord[];
}

const MATH_SYMBOLS = [
  "½",
  "¼",
  "¾",
  "÷",
  "×",
  "+",
  "-",
  "=",
  "≠",
  "≤",
  "≥",
  "²",
  "³",
  "√",
  "π",
  "₹",
  "°",
  "%",
];

export function QuestionForm({ initialQuestion, passages = [] }: QuestionFormProps) {
  const router = useRouter();
  const isEditing = !!initialQuestion;

  const [section, setSection] = useState<ExamSection>(
    initialQuestion?.section || "mental_ability"
  );
  const [topic, setTopic] = useState<string>(initialQuestion?.topic || "odd_man_out");
  const [matCategory, setMatCategory] = useState<MATCategory | "">(
    initialQuestion?.mat_category || "odd_man_out"
  );
  const [passageId, setPassageId] = useState<string>(initialQuestion?.passage_id || "");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialQuestion?.difficulty || "medium"
  );
  const [isPyq, setIsPyq] = useState<boolean>(initialQuestion?.is_pyq || false);
  const [pyqYear, setPyqYear] = useState<string>(
    initialQuestion?.pyq_year?.toString() || "2024"
  );

  const [questionTextEn, setQuestionTextEn] = useState(
    initialQuestion?.question_text_en || ""
  );
  const [questionTextHi, setQuestionTextHi] = useState(
    initialQuestion?.question_text_hi || ""
  );
  const [questionImageUrl, setQuestionImageUrl] = useState(
    initialQuestion?.question_image_url || ""
  );

  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options || [
      { key: "A", text_en: "", text_hi: "", image_url: "" },
      { key: "B", text_en: "", text_hi: "", image_url: "" },
      { key: "C", text_en: "", text_hi: "", image_url: "" },
      { key: "D", text_en: "", text_hi: "", image_url: "" },
    ]
  );
  const [correctOption, setCorrectOption] = useState<OptionKey>(
    initialQuestion?.correct_option || "A"
  );

  const [explanationEn, setExplanationEn] = useState(
    initialQuestion?.explanation_en || ""
  );
  const [explanationHi, setExplanationHi] = useState(
    initialQuestion?.explanation_hi || ""
  );

  const [previewLang, setPreviewLang] = useState<"en" | "hi">("en");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleInsertMathSymbol = (sym: string, target: "en" | "hi") => {
    if (target === "en") {
      setQuestionTextEn((prev) => prev + " " + sym + " ");
    } else {
      setQuestionTextHi((prev) => prev + " " + sym + " ");
    }
  };

  const handleOptionChange = (
    index: number,
    field: "text_en" | "text_hi" | "image_url",
    val: string
  ) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const payload = {
      section,
      topic,
      matCategory: section === "mental_ability" ? matCategory || null : null,
      passageId: section === "language" && passageId ? passageId : null,
      difficulty,
      isPyq,
      pyqYear: isPyq ? Number(pyqYear) : null,
      marks: 1.25,
      negativeMarks: 0.0,
      questionTextEn: questionTextEn || null,
      questionTextHi: questionTextHi || null,
      questionImageUrl: questionImageUrl || null,
      options,
      correctOption,
      explanationEn: explanationEn || null,
      explanationHi: explanationHi || null,
      isActive: true,
    };

    let res;
    if (isEditing && initialQuestion) {
      res = await updateQuestionAction(initialQuestion.id, payload);
    } else {
      res = await createQuestionAction(payload);
    }

    setIsPending(false);
    if (!res.success) {
      setError(res.error || "Failed to save question.");
    } else {
      router.push("/admin/questions");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/questions">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              {isEditing ? "Edit JNVST Question" : "Author New JNVST Question"}
            </h1>
            <p className="text-xs text-slate-500">
              Bilingual (English & Hindi) question creator with MAT diagram & math symbol
              support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Preview Switcher */}
          <button
            type="button"
            onClick={() => setPreviewLang(previewLang === "en" ? "hi" : "en")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 shadow-sm transition hover:bg-teal-100"
          >
            <Languages className="h-3.5 w-3.5 text-teal-700" />
            <span>
              Preview in: <strong>{previewLang === "en" ? "English" : "हिन्दी"}</strong>
            </span>
          </button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form Fields (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Exam Section & Topic Classification */}
          <Card className="space-y-4">
            <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              1. Syllabus Classification
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="JNVST Section"
                id="section"
                value={section}
                onChange={(e) => {
                  const s = e.target.value as ExamSection;
                  setSection(s);
                  if (s === "mental_ability") setTopic("odd_man_out");
                  else if (s === "arithmetic") setTopic("number_and_numeric_system");
                  else setTopic("reading_comprehension");
                }}
                options={[
                  {
                    value: "mental_ability",
                    label: "Mental Ability Test (MAT - 50 Marks)",
                  },
                  { value: "arithmetic", label: "Arithmetic Test (25 Marks)" },
                  { value: "language", label: "Language Test (25 Marks)" },
                ]}
              />

              {section === "mental_ability" && (
                <Select
                  label="MAT 10-Figure Category"
                  id="matCategory"
                  value={matCategory}
                  onChange={(e) => {
                    setMatCategory(e.target.value as MATCategory);
                    setTopic(e.target.value);
                  }}
                  options={JNVST_MAT_CATEGORIES.map((m) => ({
                    value: m.id,
                    label: `${m.title_en} (${m.title_hi})`,
                  }))}
                />
              )}

              {section === "arithmetic" && (
                <Select
                  label="Arithmetic Syllabus Topic"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  options={JNVST_ARITHMETIC_TOPICS.map((a) => ({
                    value: a.id,
                    label: `${a.title_en} (${a.title_hi})`,
                  }))}
                />
              )}

              {section === "language" && (
                <Select
                  label="Language Topic"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  options={JNVST_LANGUAGE_TOPICS.map((l) => ({
                    value: l.id,
                    label: `${l.title_en} (${l.title_hi})`,
                  }))}
                />
              )}
            </div>

            {/* If Language Section: Linked Passage Selector */}
            {section === "language" && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">
                  Link to Reading Comprehension Passage:
                </label>
                <select
                  value={passageId}
                  onChange={(e) => setPassageId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  <option value="">-- Standalone Question (No Passage) --</option>
                  {passages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title_en || p.title_hi || "Untitled Passage"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Difficulty & PYQ Metadata */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <Select
                label="Difficulty Level"
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                options={DIFFICULTY_LEVELS.map((d) => ({
                  value: d.id,
                  label: d.label,
                }))}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Previous Year Question?
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={isPyq}
                      onChange={(e) => setIsPyq(e.target.checked)}
                      className="rounded border-slate-300 text-teal-800 focus:ring-teal-700"
                    />
                    <span>Is PYQ</span>
                  </label>
                </div>
              </div>

              {isPyq && (
                <Select
                  label="PYQ Exam Year"
                  id="pyqYear"
                  value={pyqYear}
                  onChange={(e) => setPyqYear(e.target.value)}
                  options={[
                    { value: "2025", label: "JNVST 2025" },
                    { value: "2024", label: "JNVST 2024" },
                    { value: "2023", label: "JNVST 2023" },
                    { value: "2022", label: "JNVST 2022" },
                    { value: "2021", label: "JNVST 2021" },
                    { value: "2020", label: "JNVST 2020" },
                  ]}
                />
              )}
            </div>
          </Card>

          {/* 2. Bilingual Question Statement & Problem Figure */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                2. Question Statement (Bilingual)
              </h2>

              {/* Math symbols quick insertion toolbar */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-[10px] text-slate-400">Math Symbols:</span>
                {MATH_SYMBOLS.slice(0, 8).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleInsertMathSymbol(sym, previewLang)}
                    className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900"
                    title={`Insert ${sym}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="qEn" className="text-xs font-semibold text-slate-700">
                Question Text (English)
              </label>
              <textarea
                id="qEn"
                rows={3}
                value={questionTextEn}
                onChange={(e) => setQuestionTextEn(e.target.value)}
                placeholder="e.g. Find the odd figure among the given options..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="qHi" className="text-xs font-semibold text-slate-700">
                Question Text (Hindi - हिन्दी प्रश्न)
              </label>
              <textarea
                id="qHi"
                rows={3}
                value={questionTextHi}
                onChange={(e) => setQuestionTextHi(e.target.value)}
                placeholder="उदा. दिए गए विकल्पों में से असंगत आकृति ज्ञात कीजिए..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            {/* Problem Figure URL / Image Manager */}
            <div className="pt-2">
              <Input
                label="Problem Figure / Diagram Image URL (Optional)"
                id="questionImageUrl"
                value={questionImageUrl}
                onChange={(e) => setQuestionImageUrl(e.target.value)}
                placeholder="https://.../problem-figure.png (or SVG/PNG asset)"
              />
              {questionImageUrl && (
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={questionImageUrl}
                    alt="Problem figure preview"
                    className="h-16 w-16 rounded border bg-white object-contain"
                  />
                  <span className="text-[11px] text-slate-500">
                    Diagram URL preview active
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* 3. Four Options (A, B, C, D) & Answer Key */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Options & Correct Answer Key
              </h2>
              <span className="text-xs font-semibold text-teal-800">
                Correct Option: <strong>{correctOption}</strong>
              </span>
            </div>

            <div className="space-y-4">
              {options.map((opt, idx) => (
                <div
                  key={opt.key}
                  className={`rounded-xl border p-3.5 transition ${
                    correctOption === opt.key
                      ? "border-teal-600 bg-teal-50/40 ring-1 ring-teal-600"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {opt.key}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        Option {opt.key}
                      </span>
                    </div>

                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-700">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={correctOption === opt.key}
                        onChange={() => setCorrectOption(opt.key)}
                        className="text-teal-800 focus:ring-teal-700"
                      />
                      <span
                        className={
                          correctOption === opt.key ? "font-bold text-teal-900" : ""
                        }
                      >
                        Mark as Correct
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder={`Option ${opt.key} (English)`}
                      value={opt.text_en || ""}
                      onChange={(e) => handleOptionChange(idx, "text_en", e.target.value)}
                      className="rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={`विकल्प ${opt.key} (हिन्दी)`}
                      value={opt.text_hi || ""}
                      onChange={(e) => handleOptionChange(idx, "text_hi", e.target.value)}
                      className="rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                  </div>

                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder={`Option ${opt.key} Figure Image URL (Optional for MAT diagrams)`}
                      value={opt.image_url || ""}
                      onChange={(e) =>
                        handleOptionChange(idx, "image_url", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-1.5 text-[11px] text-slate-700 focus:border-teal-700 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 4. Step-by-Step Solutions / Explanation */}
          <Card className="space-y-4">
            <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              4. Step-by-Step Solution / Explanation
            </h2>

            <div className="space-y-1">
              <label htmlFor="expEn" className="text-xs font-semibold text-slate-700">
                Solution Explanation (English)
              </label>
              <textarea
                id="expEn"
                rows={3}
                value={explanationEn}
                onChange={(e) => setExplanationEn(e.target.value)}
                placeholder="Explain why the chosen option is correct with shortcut formula..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="expHi" className="text-xs font-semibold text-slate-700">
                Solution Explanation (Hindi - हिन्दी व्याख्या)
              </label>
              <textarea
                id="expHi"
                rows={3}
                value={explanationHi}
                onChange={(e) => setExplanationHi(e.target.value)}
                placeholder="विस्तृत हल और सही उत्तर का कारण हिन्दी में लिखें..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/admin/questions">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              className="gap-2 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {isEditing ? "Update Question" : "Publish to Question Bank"}
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time Live Preview (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-md">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Live Student Preview
                </span>
              </div>
              <Badge variant="accent">
                {previewLang === "en" ? "English Mode" : "हिन्दी माध्यम"}
              </Badge>
            </div>

            {/* Simulated Question Card */}
            <Card className="space-y-4 border-2 border-teal-800/20 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <Badge variant="brand">{section.toUpperCase().replace("_", " ")}</Badge>
                {isPyq && <Badge variant="accent">PYQ {pyqYear}</Badge>}
                <Badge
                  variant={
                    difficulty === "easy"
                      ? "success"
                      : difficulty === "hard"
                        ? "danger"
                        : "warning"
                  }
                >
                  {difficulty.toUpperCase()}
                </Badge>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-sm font-semibold leading-relaxed text-slate-900">
                  {(previewLang === "en" ? questionTextEn : questionTextHi) || (
                    <span className="italic text-slate-400">
                      Type question statement above to see live preview...
                    </span>
                  )}
                </p>

                {questionImageUrl && (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 text-center">
                    <img
                      src={questionImageUrl}
                      alt="Preview Diagram"
                      className="mx-auto max-h-36 rounded object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2">
                {options.map((opt) => {
                  const txt = previewLang === "en" ? opt.text_en : opt.text_hi;
                  const isCorrect = opt.key === correctOption;

                  return (
                    <div
                      key={opt.key}
                      className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                        isCorrect
                          ? "border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-950"
                          : "border-slate-200 bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="flex-1 space-y-1">
                        <span>{txt || `(Option ${opt.key} text)`}</span>
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            alt={`Option ${opt.key}`}
                            className="max-h-16 rounded border bg-white object-contain p-1"
                          />
                        )}
                      </div>
                      {isCorrect && (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Preview */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
                <div className="mb-1 flex items-center gap-1 font-bold text-slate-800">
                  <HelpCircle className="h-3.5 w-3.5 text-teal-800" />
                  <span>Solution Key: Option {correctOption}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {(previewLang === "en" ? explanationEn : explanationHi) ||
                    "Enter solution text to provide step-by-step guidance."}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
