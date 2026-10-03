"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Globe,
  Layers,
  Send,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VirtualOMRSheet } from "./VirtualOMRSheet";
import { QuestionPalette, type QuestionStatusInfo } from "./QuestionPalette";
import { saveTestResponseAction, submitTestAttemptAction } from "@/features/tests/actions";
import type {
  MockTestRecord,
  MockTestQuestionRecord,
  TestAttemptRecord,
  TestResponseRecord,
  OptionKey,
  ExamSection,
} from "@/server/db/types";

interface TestTakingInterfaceProps {
  test: MockTestRecord;
  attempt: TestAttemptRecord;
  testQuestions: MockTestQuestionRecord[];
  initialResponses: TestResponseRecord[];
}

export function TestTakingInterface({
  test,
  attempt,
  testQuestions,
  initialResponses,
}: TestTakingInterfaceProps) {
  const router = useRouter();

  // Test Mode & Language
  const [testMode, setTestMode] = useState<"cbt" | "omr">("cbt");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Time remaining in seconds
  const totalDurationSeconds = test.duration_minutes * 60;
  const initialElapsed = attempt.time_spent_seconds || 0;
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, totalDurationSeconds - initialElapsed)
  );

  // Question Responses & Statuses
  const [responses, setResponses] = useState<Record<number, OptionKey | null>>(() => {
    const map: Record<number, OptionKey | null> = {};
    testQuestions.forEach((tq, idx) => {
      const existing = initialResponses.find((r) => r.question_id === tq.question_id);
      map[idx] = existing?.selected_option || null;
    });
    return map;
  });

  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    testQuestions.forEach((tq, idx) => {
      const existing = initialResponses.find((r) => r.question_id === tq.question_id);
      map[idx] = existing?.is_marked_for_review || false;
    });
    return map;
  });

  const [visited, setVisited] = useState<Record<number, boolean>>({
    0: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Current Question
  const currentItem = testQuestions[currentIndex];
  const currentQuestion = currentItem?.question;
  const currentPassage = currentQuestion?.passage;

  // Active Section
  const currentSection = currentItem?.section as ExamSection;

  // Sections breakdown
  const sectionsList: { section: ExamSection; label: string; startIndex: number; count: number }[] = [
    { section: "mental_ability", label: "Mental Ability (मानसिक योग्यता)", startIndex: 0, count: 0 },
    { section: "arithmetic", label: "Arithmetic (अंकगणित)", startIndex: 0, count: 0 },
    { section: "language", label: "Language (भाषा)", startIndex: 0, count: 0 },
  ];

  // Calculate section ranges
  let cursor = 0;
  sectionsList.forEach((sec) => {
    const count = testQuestions.filter((q) => q.section === sec.section).length;
    sec.startIndex = cursor;
    sec.count = count;
    cursor += count;
  });

  // Filter sections that actually have questions
  const activeSections = sectionsList.filter((s) => s.count > 0);

  // Countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  // Format Timer
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = async (qIndex: number, option: OptionKey) => {
    setResponses((prev) => ({ ...prev, [qIndex]: option }));
    setVisited((prev) => ({ ...prev, [qIndex]: true }));
    saveAnswer(qIndex, option, markedForReview[qIndex]);
  };

  const handleClearOption = async (qIndex: number) => {
    setResponses((prev) => ({ ...prev, [qIndex]: null }));
    saveAnswer(qIndex, null, markedForReview[qIndex]);
  };

  const handleToggleReview = async () => {
    const newVal = !markedForReview[currentIndex];
    setMarkedForReview((prev) => ({ ...prev, [currentIndex]: newVal }));
    saveAnswer(currentIndex, responses[currentIndex], newVal);
  };

  const saveAnswer = async (
    qIndex: number,
    option: OptionKey | null,
    isReview?: boolean
  ) => {
    const item = testQuestions[qIndex];
    if (!item) return;

    setSaveStatus("saving");
    try {
      await saveTestResponseAction({
        attemptId: attempt.id,
        questionId: item.question_id,
        selectedOption: option,
        isMarkedForReview: isReview ?? false,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const jumpToQuestion = (index: number) => {
    if (index >= 0 && index < testQuestions.length) {
      setCurrentIndex(index);
      setVisited((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleNext = () => {
    if (currentIndex < testQuestions.length - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      jumpToQuestion(currentIndex - 1);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const timeSpent = totalDurationSeconds - secondsRemaining;
    try {
      const res = await submitTestAttemptAction(attempt.id, timeSpent);
      if (res.success && res.data) {
        router.push(`/tests/${test.id}/attempt/${attempt.id}/result`);
      } else {
        alert(res.error || "Failed to submit test. Please retry.");
        setIsSubmitting(false);
      }
    } catch (e: any) {
      alert("Submission error: " + e.message);
      setIsSubmitting(false);
    }
  };

  // Build question statuses for palette
  const paletteStatuses: Record<number, QuestionStatusInfo> = {};
  testQuestions.forEach((_, idx) => {
    paletteStatuses[idx] = {
      isAnswered: responses[idx] !== null && responses[idx] !== undefined,
      isMarkedForReview: !!markedForReview[idx],
      isVisited: !!visited[idx],
    };
  });

  const totalAnswered = Object.values(responses).filter((r) => r !== null).length;
  const totalReview = Object.values(markedForReview).filter(Boolean).length;
  const totalUnanswered = testQuestions.length - totalAnswered;

  const isLowTime = secondsRemaining <= 600; // < 10 mins

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Top Test Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Test Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 uppercase tracking-wide">
                {test.exam_type.replace("_", " ")}
              </span>
              <h1 className="text-sm font-bold text-slate-900 line-clamp-1 sm:text-base">
                {test.title}
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Student: <span className="font-semibold text-slate-700">{attempt.student?.full_name || "Enrolled Student"}</span>
            </p>
          </div>

          {/* Controls: Mode Switch, Lang Toggle, Timer, Submit */}
          <div className="flex items-center gap-3">
            {/* CBT / OMR Toggle */}
            <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex">
              <button
                type="button"
                onClick={() => setTestMode("cbt")}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                  testMode === "cbt"
                    ? "bg-white text-teal-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                CBT Mode
              </button>
              <button
                type="button"
                onClick={() => setTestMode("omr")}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                  testMode === "omr"
                    ? "bg-white text-teal-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Virtual OMR
              </button>
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-amber-600" />
              <span>{lang === "en" ? "English" : "हिंदी"}</span>
            </button>

            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-bold shadow-xs ${
                isLowTime
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-300 animate-pulse"
                  : "bg-slate-900 text-white"
              }`}
            >
              <Clock className={`h-3.5 w-3.5 ${isLowTime ? "text-rose-600" : "text-amber-400"}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit Button */}
            <Button
              variant="brand"
              size="sm"
              onClick={() => setShowSubmitModal(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              Submit Test
            </Button>
          </div>
        </div>

        {/* Section Tabs Bar */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto py-1.5">
            {activeSections.map((sec) => {
              const isActive = currentSection === sec.section;
              const answeredInSection = testQuestions
                .slice(sec.startIndex, sec.startIndex + sec.count)
                .filter((_, i) => responses[sec.startIndex + i] !== null).length;

              return (
                <button
                  key={sec.section}
                  type="button"
                  onClick={() => jumpToQuestion(sec.startIndex)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-teal-800 shadow-xs border border-teal-200 font-bold"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  }`}
                >
                  <span>{sec.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {answeredInSection}/{sec.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Test Body */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 p-4 sm:p-6">
        {/* Left Column: Question / OMR View */}
        <div className="flex-1 space-y-4">
          {testMode === "omr" ? (
            /* Virtual OMR View */
            <VirtualOMRSheet
              totalQuestions={testQuestions.length}
              currentQuestionIndex={currentIndex}
              responses={responses}
              onSelectOption={handleSelectOption}
              onJumpToQuestion={jumpToQuestion}
              onClearOption={handleClearOption}
            />
          ) : (
            /* Computer Based Test (CBT) Question Card */
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {/* Question Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    {currentIndex + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Question {currentIndex + 1} of {testQuestions.length}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    +1.25 marks
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReview}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      markedForReview[currentIndex]
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Flag className={`h-3.5 w-3.5 ${markedForReview[currentIndex] ? "fill-amber-600 text-amber-600" : ""}`} />
                    <span>{markedForReview[currentIndex] ? "Marked for Review" : "Mark for Review"}</span>
                  </button>
                </div>
              </div>

              {/* Reading Passage (if applicable) */}
              {currentPassage && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                      Passage (गद्यांश)
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      {lang === "hi" && currentPassage.title_hi
                        ? currentPassage.title_hi
                        : currentPassage.title_en}
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-line font-serif">
                    {lang === "hi" && currentPassage.content_hi
                      ? currentPassage.content_hi
                      : currentPassage.content_en}
                  </p>
                </div>
              )}

              {/* Question Text */}
              <div className="mt-4">
                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {lang === "hi" && currentQuestion?.question_text_hi
                    ? currentQuestion.question_text_hi
                    : currentQuestion?.question_text_en}
                </p>

                {/* Problem Diagram (MAT) */}
                {currentQuestion?.question_image_url && (
                  <div className="mt-4 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <img
                      src={currentQuestion.question_image_url}
                      alt="Question Figure"
                      className="max-h-60 rounded object-contain"
                    />
                  </div>
                )}
              </div>

              {/* 4 Multiple Choice Options (A, B, C, D) */}
              <div className="mt-6 space-y-3">
                {currentQuestion?.options.map((opt) => {
                  const isSelected = responses[currentIndex] === opt.key;
                  const optText = lang === "hi" && opt.text_hi ? opt.text_hi : opt.text_en;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(currentIndex, opt.key)}
                      className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? "border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-600 font-semibold"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {/* Option Key Bubble */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-teal-700 text-white shadow-sm"
                            : "border border-slate-300 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {opt.key}
                      </span>

                      {/* Option Content: Text or Image */}
                      <div className="flex-1">
                        {optText && (
                          <span className="text-sm text-slate-900 leading-normal">
                            {optText}
                          </span>
                        )}
                        {opt.image_url && (
                          <div className="mt-2">
                            <img
                              src={opt.image_url}
                              alt={`Option ${opt.key}`}
                              className="max-h-32 rounded border border-slate-200 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  {responses[currentIndex] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClearOption(currentIndex)}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Clear Response
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === testQuestions.length - 1}
                  >
                    Next Question
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Palette & Progress */}
        <aside className="hidden w-80 shrink-0 space-y-4 lg:block">
          <QuestionPalette
            totalQuestions={testQuestions.length}
            currentIndex={currentIndex}
            questionStatuses={paletteStatuses}
            onSelectQuestion={jumpToQuestion}
            sectionNames={activeSections.map((s) => ({
              name: s.label.split(" (")[0],
              range: [s.startIndex, s.startIndex + s.count - 1],
            }))}
          />
        </aside>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready to Submit Exam?
                </h3>
                <p className="text-xs text-slate-500">
                  Please review your attempt summary before final submission.
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
              <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200">
                <span className="block text-lg font-bold text-emerald-800">
                  {totalAnswered}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Answered</span>
              </div>
              <div className="rounded-lg bg-rose-50 p-2 border border-rose-200">
                <span className="block text-lg font-bold text-rose-800">
                  {totalUnanswered}
                </span>
                <span className="text-[11px] font-semibold text-rose-700">Unanswered</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 border border-amber-200">
                <span className="block text-lg font-bold text-amber-800">
                  {totalReview}
                </span>
                <span className="text-[11px] font-semibold text-amber-700">Review</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Once submitted, you will immediately see your detailed diagnostic scorecard and solutions.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Resume Exam
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
