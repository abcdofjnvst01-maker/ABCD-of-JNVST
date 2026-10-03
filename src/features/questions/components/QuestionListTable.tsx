"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type {
  QuestionRecord,
  PassageRecord,
  ExamSection,
  MATCategory,
} from "@/server/db/types";
import { JNVST_SECTIONS, JNVST_MAT_CATEGORIES, DIFFICULTY_LEVELS } from "@/lib/constants";
import { deleteQuestionAction } from "@/features/questions/actions";
import { QuestionPreviewModal } from "./QuestionPreviewModal";
import { PassageManagerModal } from "./PassageManagerModal";
import { BulkImportModal } from "./BulkImportModal";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Plus,
  Upload,
  BookOpen,
  Eye,
  Edit2,
  Trash2,
  Layers,
  Brain,
  Calculator,
  Languages,
  Award,
  Filter,
} from "lucide-react";

interface QuestionListTableProps {
  questions: QuestionRecord[];
  passages: PassageRecord[];
}

export function QuestionListTable({ questions, passages }: QuestionListTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedMatCategory, setSelectedMatCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [onlyPyq, setOnlyPyq] = useState(false);

  const [previewQuestion, setPreviewQuestion] = useState<QuestionRecord | null>(null);
  const [showPassageModal, setShowPassageModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedSection !== "all" && q.section !== selectedSection) return false;
      if (
        selectedSection === "mental_ability" &&
        selectedMatCategory !== "all" &&
        q.mat_category !== selectedMatCategory
      ) {
        return false;
      }
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty)
        return false;
      if (onlyPyq && !q.is_pyq) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTopic = q.topic.toLowerCase().includes(term);
        const matchesEn = q.question_text_en?.toLowerCase().includes(term);
        const matchesHi = q.question_text_hi?.includes(term);
        if (!matchesTopic && !matchesEn && !matchesHi) return false;
      }

      return true;
    });
  }, [
    questions,
    selectedSection,
    selectedMatCategory,
    selectedDifficulty,
    onlyPyq,
    searchTerm,
  ]);

  // Section counts
  const counts = useMemo(() => {
    let mat = 0;
    let arith = 0;
    let lang = 0;
    let pyq = 0;
    questions.forEach((q) => {
      if (q.section === "mental_ability") mat++;
      if (q.section === "arithmetic") arith++;
      if (q.section === "language") lang++;
      if (q.is_pyq) pyq++;
    });
    return { mat, arith, lang, pyq };
  }, [questions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    await deleteQuestionAction(id);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Question Bank Manager
            </h1>
            <Badge variant="brand">Phase 1 Content Engine</Badge>
          </div>
          <p className="text-xs text-slate-600 sm:text-sm">
            Author, categorize, and manage bilingual questions for JNVST Class 6 exam
            preparation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPassageModal(true)}
            className="gap-1.5 border-indigo-200 text-xs text-indigo-900 hover:bg-indigo-50"
          >
            <BookOpen className="h-4 w-4 text-indigo-700" /> Passages ({passages.length})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkModal(true)}
            className="gap-1.5 text-xs"
          >
            <Upload className="h-4 w-4 text-slate-600" /> Bulk Import
          </Button>

          <Link href="/admin/questions/new">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Add Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-l-4 border-l-teal-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                Mental Ability
              </p>
              <h3 className="mt-0.5 text-xl font-extrabold text-slate-900">
                {counts.mat}
              </h3>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">10 Figure Categories</span>
        </Card>

        <Card className="border-l-4 border-l-amber-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                Arithmetic
              </p>
              <h3 className="mt-0.5 text-xl font-extrabold text-slate-900">
                {counts.arith}
              </h3>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Calculator className="h-4 w-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">15 Syllabus Topics</span>
        </Card>

        <Card className="border-l-4 border-l-indigo-600 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                Language
              </p>
              <h3 className="mt-0.5 text-xl font-extrabold text-slate-900">
                {counts.lang}
              </h3>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-800">
              <Languages className="h-4 w-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">Passages & Vocab</span>
        </Card>

        <Card className="border-l-4 border-l-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">
                PYQ Archive
              </p>
              <h3 className="mt-0.5 text-xl font-extrabold text-slate-900">
                {counts.pyq}
              </h3>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">Previous Year Questions</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="space-y-3 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Section Pill Selectors */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedSection("all");
                setSelectedMatCategory("all");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSection === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Sections ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSection("mental_ability")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSection === "mental_ability"
                  ? "bg-teal-800 text-white"
                  : "bg-teal-50 text-teal-900 hover:bg-teal-100"
              }`}
            >
              Mental Ability ({counts.mat})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSection("arithmetic");
                setSelectedMatCategory("all");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSection === "arithmetic"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100"
              }`}
            >
              Arithmetic ({counts.arith})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSection("language");
                setSelectedMatCategory("all");
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedSection === "language"
                  ? "bg-indigo-700 text-white"
                  : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
              }`}
            >
              Language ({counts.lang})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search topic or question..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
          {selectedSection === "mental_ability" && (
            <select
              value={selectedMatCategory}
              onChange={(e) => setSelectedMatCategory(e.target.value)}
              className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-teal-700"
            >
              <option value="all">All MAT Categories</option>
              {JNVST_MAT_CATEGORIES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title_en}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-lg border border-slate-300 p-1.5 text-xs text-slate-800 focus:border-teal-700"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
            <input
              type="checkbox"
              checked={onlyPyq}
              onChange={(e) => setOnlyPyq(e.target.checked)}
              className="rounded text-teal-800 focus:ring-teal-700"
            />
            <span>PYQs Only</span>
          </label>

          {(searchTerm ||
            selectedSection !== "all" ||
            selectedDifficulty !== "all" ||
            onlyPyq) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedSection("all");
                setSelectedMatCategory("all");
                setSelectedDifficulty("all");
                setOnlyPyq(false);
              }}
              className="text-xs text-teal-800 underline hover:text-teal-900"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Questions Table */}
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Section & Topic</th>
                <th className="px-4 py-3">Question Statement (Bilingual)</th>
                <th className="px-4 py-3">Correct Ans</th>
                <th className="px-4 py-3">Difficulty & PYQ</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No questions found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q) => (
                  <tr key={q.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <Badge
                          variant={
                            q.section === "mental_ability"
                              ? "brand"
                              : q.section === "arithmetic"
                                ? "accent"
                                : "neutral"
                          }
                          className="text-[10px] uppercase"
                        >
                          {q.section.replace("_", " ")}
                        </Badge>
                        <p className="text-xs font-semibold capitalize text-slate-900">
                          {q.topic.replace(/_/g, " ")}
                        </p>
                      </div>
                    </td>

                    <td className="max-w-md px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <p className="line-clamp-2 font-medium text-slate-900">
                          {q.question_text_en || (
                            <span className="italic text-slate-400">
                              (No English prompt)
                            </span>
                          )}
                        </p>
                        <p className="line-clamp-1 text-[11px] text-slate-500">
                          {q.question_text_hi || (
                            <span className="italic text-slate-400">
                              (No Hindi prompt)
                            </span>
                          )}
                        </p>
                        {q.question_image_url && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            🖼️ Has Diagram
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                        {q.correct_option}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={
                            q.difficulty === "easy"
                              ? "success"
                              : q.difficulty === "hard"
                                ? "danger"
                                : "warning"
                          }
                          className="text-[10px]"
                        >
                          {q.difficulty.toUpperCase()}
                        </Badge>
                        {q.is_pyq && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                            PYQ {q.pyq_year || "JNVST"}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right align-top">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(q)}
                          className="rounded-lg p-1.5 text-teal-800 hover:bg-teal-50"
                          title="Preview Bilingual Question"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <Link href={`/admin/questions/${q.id}`}>
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                            title="Edit Question"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                          title="Delete Question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          passage={passages.find((p) => p.id === previewQuestion.passage_id) || null}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

      {showPassageModal && (
        <PassageManagerModal
          passages={passages}
          onClose={() => setShowPassageModal(false)}
        />
      )}

      {showBulkModal && <BulkImportModal onClose={() => setShowBulkModal(false)} />}
    </div>
  );
}
