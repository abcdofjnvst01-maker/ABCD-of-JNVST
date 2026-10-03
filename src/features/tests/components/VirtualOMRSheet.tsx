"use client";

import React from "react";
import type { OptionKey } from "@/server/db/types";

interface VirtualOMRSheetProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  responses: Record<number, OptionKey | null>;
  onSelectOption: (questionIndex: number, option: OptionKey) => void;
  onJumpToQuestion: (questionIndex: number) => void;
  onClearOption: (questionIndex: number) => void;
}

export function VirtualOMRSheet({
  totalQuestions,
  currentQuestionIndex,
  responses,
  onSelectOption,
  onJumpToQuestion,
  onClearOption,
}: VirtualOMRSheetProps) {
  const options: OptionKey[] = ["A", "B", "C", "D"];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-teal-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">
              Virtual JNVST OMR Answer Sheet (उत्तर पत्रक)
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Click bubbles to shade your answer. Shading simulates pen & paper bubbling.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full border border-slate-300 bg-white" />
            <span className="text-slate-600">Unshaded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full bg-slate-900 shadow-sm" />
            <span className="font-medium text-slate-900">Filled Bubble</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-teal-600 bg-teal-50" />
            <span className="font-semibold text-teal-700">Active Q</span>
          </div>
        </div>
      </div>

      {/* Bubbling Grid */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const qNum = i + 1;
          const selected = responses[i];
          const isActive = currentQuestionIndex === i;

          return (
            <div
              key={qNum}
              onClick={() => onJumpToQuestion(i)}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                isActive
                  ? "bg-teal-50/80 ring-2 ring-teal-600 font-semibold"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Question Number */}
              <div className="flex items-center gap-2 w-10">
                <span
                  className={`text-xs font-mono font-bold ${
                    isActive ? "text-teal-900" : "text-slate-600"
                  }`}
                >
                  Q{qNum < 10 ? `0${qNum}` : qNum}
                </span>
              </div>

              {/* 4 Bubble Choices: A, B, C, D */}
              <div className="flex items-center gap-2">
                {options.map((opt) => {
                  const isFilled = selected === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFilled) {
                          onClearOption(i);
                        } else {
                          onSelectOption(i, opt);
                        }
                      }}
                      title={`Select ${opt} for Q${qNum}`}
                      className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isFilled
                          ? "bg-slate-950 text-white shadow-inner scale-95"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Clear button if selected */}
              <div className="w-5 text-right">
                {selected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearOption(i);
                    }}
                    title="Clear response"
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
