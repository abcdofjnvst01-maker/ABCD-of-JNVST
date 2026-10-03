"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  ArrowLeft,
  Globe,
  RotateCcw,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type {
  TestAttemptRecord,
  MockTestQuestionRecord,
  TestResponseRecord,
  ExamSection,
  OptionKey,
} from "@/server/db/types";

interface TestScorecardProps {
  attempt: TestAttemptRecord;
  testQuestions: MockTestQuestionRecord[];
  responses: TestResponseRecord[];
}

export function TestScorecard({ attempt, testQuestions, responses }: TestScorecardProps) {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");

  const responseMap = new Map<string, TestResponseRecord>();
  responses.forEach((r) => responseMap.set(r.question_id, r));

  const score = Number(attempt.score || 0);
  const totalMarks = Number(attempt.total_marks || 100);
  const percentage = Math.round((score / totalMarks) * 100);
  const accuracy = Number(attempt.accuracy_percentage || 0);

  // Time format
  const mins = Math.floor(attempt.time_spent_seconds / 60);
  const secs = attempt.time_spent_seconds % 60;
  const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  // Filtered Questions
  const filteredQuestions = testQuestions.filter((item) => {
    if (filterSection !== "all" && item.section !== filterSection) return false;
    const resp = responseMap.get(item.question_id);
    const isAttempted = resp && resp.selected_option !== null;

    if (filterStatus === "correct") {
      return isAttempted && resp.is_correct;
    }
    if (filterStatus === "incorrect") {
      return isAttempted && !resp.is_correct;
    }
    if (filterStatus === "unattempted") {
      return !isAttempted;
    }
    return true;
  });

  const getSectionTitle = (sec: ExamSection) => {
    switch (sec) {
      case "mental_ability":
        return "Mental Ability (मानसिक योग्यता)";
      case "arithmetic":
        return "Arithmetic (अंकगणित)";
      case "language":
        return "Language Test (भाषा परीक्षण)";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Header */}
      <div className="border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/tests"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="brand">Diagnostic Scorecard</Badge>
                <span className="text-xs text-slate-500">
                  {new Date(attempt.completed_at || attempt.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                {attempt.test?.title || "JNVST Mock Test"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-amber-600" />
              <span>{lang === "en" ? "English" : "हिंदी"}</span>
            </button>
            <Link href={`/tests/${attempt.test_id}/start`}>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Retake Test
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* Hero Performance Card */}
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 sm:items-center">
            {/* Score circle */}
            <div className="flex flex-col items-center justify-center border-b border-teal-700/50 pb-6 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-500/20 border-4 border-amber-400 shadow-inner">
                <div>
                  <span className="block text-2xl font-black text-amber-300">
                    {score}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-teal-200">
                    / {totalMarks} Marks
                  </span>
                </div>
              </div>
              <span className="mt-3 text-xs font-bold tracking-wider text-teal-200 uppercase">
                Overall Score
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="col-span-3 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                <div className="flex justify-center text-teal-300 mb-1">
                  <Target className="h-5 w-5" />
                </div>
                <span className="block text-xl font-bold text-white">{percentage}%</span>
                <span className="text-[11px] text-teal-200">Total Marks %</span>
              </div>

              <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                <div className="flex justify-center text-amber-300 mb-1">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="block text-xl font-bold text-white">{accuracy}%</span>
                <span className="text-[11px] text-teal-200">Accuracy</span>
              </div>

              <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs">
                <div className="flex justify-center text-teal-300 mb-1">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="block text-xl font-bold text-white">{timeFormatted}</span>
                <span className="text-[11px] text-teal-200">Time Taken</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section-Wise Breakdown Cards */}
        {attempt.section_scores && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Section Performance Analysis (खंडवार प्रदर्शन)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(["mental_ability", "arithmetic", "language"] as ExamSection[]).map((sec) => {
                const data = attempt.section_scores[sec];
                if (!data || data.questions_count === 0) return null;

                const secPct = data.total_marks > 0 ? Math.round((data.score / data.total_marks) * 100) : 0;

                return (
                  <div
                    key={sec}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        {getSectionTitle(sec).split(" (")[0]}
                      </h4>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                        {data.score} / {data.total_marks}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-4">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all"
                        style={{ width: `${secPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                        <span className="block font-bold">{data.correct_count}</span>
                        <span className="text-[10px] text-emerald-600">Correct</span>
                      </div>
                      <div className="rounded-lg bg-rose-50 p-2 text-rose-800">
                        <span className="block font-bold">{data.incorrect_count}</span>
                        <span className="text-[10px] text-rose-600">Wrong</span>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                        <span className="block font-bold">{data.unattempted_count}</span>
                        <span className="text-[10px] text-slate-500">Skipped</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Solutions Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Detailed Solutions & Answer Key (विस्तृत हल)
              </h3>
              <p className="text-xs text-slate-500">
                Review each question, your chosen option, and the official step-by-step solution.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Section Filter */}
              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">All Sections</option>
                <option value="mental_ability">Mental Ability (MAT)</option>
                <option value="arithmetic">Arithmetic</option>
                <option value="language">Language</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="all">All Questions</option>
                <option value="correct">✓ Correct Only</option>
                <option value="incorrect">✕ Incorrect Only</option>
                <option value="unattempted">○ Skipped Only</option>
              </select>
            </div>
          </div>

          {/* Questions List */}
          <div className="mt-6 space-y-6">
            {filteredQuestions.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No questions match the selected filter.
              </div>
            ) : (
              filteredQuestions.map((item, idx) => {
                const q = item.question;
                if (!q) return null;

                const resp = responseMap.get(item.question_id);
                const isAttempted = resp && resp.selected_option !== null;
                const isCorrect = isAttempted && resp.is_correct;
                const passage = q.passage;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-5 transition-all ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isAttempted
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          Q{item.order_index}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          {q.section.replace("_", " ")}
                        </span>
                        {q.is_pyq && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            PYQ {q.pyq_year}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Correct (+{item.marks})
                          </span>
                        ) : isAttempted ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-600">
                            <XCircle className="h-4 w-4" /> Incorrect (0.00)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                            <HelpCircle className="h-4 w-4" /> Unattempted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Passage Context if applicable */}
                    {passage && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-700 font-serif">
                        <span className="font-bold block text-amber-900 mb-1">
                          Passage: {lang === "hi" && passage.title_hi ? passage.title_hi : passage.title_en}
                        </span>
                        <p className="line-clamp-3">
                          {lang === "hi" && passage.content_hi ? passage.content_hi : passage.content_en}
                        </p>
                      </div>
                    )}

                    {/* Question Text & Diagram */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-900 leading-relaxed">
                        {lang === "hi" && q.question_text_hi ? q.question_text_hi : q.question_text_en}
                      </p>

                      {q.question_image_url && (
                        <div className="mt-3 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <img
                            src={q.question_image_url}
                            alt="Question Diagram"
                            className="max-h-48 rounded object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {q.options.map((opt) => {
                        const isStudentChoice = resp?.selected_option === opt.key;
                        const isCorrectKey = q.correct_option === opt.key;
                        const optText = lang === "hi" && opt.text_hi ? opt.text_hi : opt.text_en;

                        let styleClass = "border-slate-200 bg-white text-slate-700";
                        if (isCorrectKey) {
                          styleClass = "border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-500";
                        } else if (isStudentChoice && !isCorrectKey) {
                          styleClass = "border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-400";
                        }

                        return (
                          <div
                            key={opt.key}
                            className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-xs transition-all ${styleClass}`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold ${
                                isCorrectKey
                                  ? "bg-emerald-600 text-white"
                                  : isStudentChoice
                                  ? "bg-rose-500 text-white"
                                  : "border border-slate-300 bg-slate-50"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <div className="flex-1">
                              {optText && <span>{optText}</span>}
                              {opt.image_url && (
                                <img
                                  src={opt.image_url}
                                  alt={`Option ${opt.key}`}
                                  className="mt-1 max-h-24 rounded border border-slate-200 object-contain"
                                />
                              )}
                            </div>
                            {isStudentChoice && (
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                (Your Answer)
                              </span>
                            )}
                            {isCorrectKey && (
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                                (Correct Key)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    {(q.explanation_en || q.explanation_hi) && (
                      <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3.5 text-xs">
                        <span className="mb-1 flex items-center gap-1.5 font-bold text-teal-900">
                          <BookOpen className="h-3.5 w-3.5 text-teal-700" />
                          Explanation & Solution (स्पष्टीकरण):
                        </span>
                        <p className="text-slate-800 leading-relaxed">
                          {lang === "hi" && q.explanation_hi ? q.explanation_hi : q.explanation_en}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
