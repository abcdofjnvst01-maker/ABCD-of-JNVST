"use client";

import React from "react";
import type { OptionKey } from "@/server/db/types";

export interface QuestionStatusInfo {
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
}

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  questionStatuses: Record<number, QuestionStatusInfo>;
  onSelectQuestion: (index: number) => void;
  sectionNames?: { name: string; range: [number, number] }[];
}

export function QuestionPalette({
  totalQuestions,
  currentIndex,
  questionStatuses,
  onSelectQuestion,
  sectionNames,
}: QuestionPaletteProps) {
  // Compute summary stats
  let answeredCount = 0;
  let markedCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const s = questionStatuses[i];
    if (s?.isAnswered && s?.isMarkedForReview) {
      markedCount += 1;
    } else if (s?.isAnswered) {
      answeredCount += 1;
    } else if (s?.isMarkedForReview) {
      markedCount += 1;
    } else if (s?.isVisited) {
      notAnsweredCount += 1;
    } else {
      notVisitedCount += 1;
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-900 mb-3">Question Palette (प्रश्नावली)</h4>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 font-bold text-white text-[10px]">
            {answeredCount}
          </span>
          <span className="text-slate-600">Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500 font-bold text-white text-[10px]">
            {notAnsweredCount}
          </span>
          <span className="text-slate-600">Not Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 font-bold text-white text-[10px]">
            {markedCount}
          </span>
          <span className="text-slate-600">Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 font-bold text-slate-700 text-[10px]">
            {notVisitedCount}
          </span>
          <span className="text-slate-600">Not Visited</span>
        </div>
      </div>

      {/* Palette Grid */}
      <div className="max-h-72 overflow-y-auto pr-1">
        {sectionNames && sectionNames.length > 0 ? (
          <div className="space-y-4">
            {sectionNames.map((sec, secIdx) => (
              <div key={secIdx}>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {sec.name}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from(
                    { length: sec.range[1] - sec.range[0] + 1 },
                    (_, i) => {
                      const idx = sec.range[0] + i;
                      const qNum = idx + 1;
                      const s = questionStatuses[idx];
                      const isCurrent = currentIndex === idx;

                      let bgClass = "bg-slate-100 text-slate-700 hover:bg-slate-200";
                      if (s?.isAnswered && s?.isMarkedForReview) {
                        bgClass = "bg-purple-600 text-white";
                      } else if (s?.isAnswered) {
                        bgClass = "bg-emerald-600 text-white";
                      } else if (s?.isMarkedForReview) {
                        bgClass = "bg-amber-500 text-white";
                      } else if (s?.isVisited) {
                        bgClass = "bg-rose-500 text-white";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onSelectQuestion(idx)}
                          className={`h-8 w-full rounded text-xs font-bold transition-all ${bgClass} ${
                            isCurrent
                              ? "ring-2 ring-teal-600 ring-offset-2 scale-105 shadow-sm"
                              : ""
                          }`}
                        >
                          {qNum}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalQuestions }, (_, idx) => {
              const qNum = idx + 1;
              const s = questionStatuses[idx];
              const isCurrent = currentIndex === idx;

              let bgClass = "bg-slate-100 text-slate-700 hover:bg-slate-200";
              if (s?.isAnswered && s?.isMarkedForReview) {
                bgClass = "bg-purple-600 text-white";
              } else if (s?.isAnswered) {
                bgClass = "bg-emerald-600 text-white";
              } else if (s?.isMarkedForReview) {
                bgClass = "bg-amber-500 text-white";
              } else if (s?.isVisited) {
                bgClass = "bg-rose-500 text-white";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectQuestion(idx)}
                  className={`h-8 w-full rounded text-xs font-bold transition-all ${bgClass} ${
                    isCurrent
                      ? "ring-2 ring-teal-600 ring-offset-2 scale-105 shadow-sm"
                      : ""
                  }`}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
