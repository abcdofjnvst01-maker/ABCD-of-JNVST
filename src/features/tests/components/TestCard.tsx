"use client";

import React from "react";
import Link from "next/link";
import { Clock, HelpCircle, Award, PlayCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { MockTestRecord, ExamType, ExamSection } from "@/server/db/types";

interface TestCardProps {
  test: MockTestRecord;
  hasAttempted?: boolean;
  lastAttemptId?: string;
  lastScore?: number;
}

export function TestCard({
  test,
  hasAttempted,
  lastAttemptId,
  lastScore,
}: TestCardProps) {
  const getExamTypeBadge = (type: ExamType) => {
    switch (type) {
      case "full_mock":
        return <Badge variant="brand">Full Mock Exam</Badge>;
      case "sectional":
        return <Badge variant="accent">Sectional Test</Badge>;
      case "topic_drill":
        return <Badge variant="warning">Speed Drill</Badge>;
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-teal-300 hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {getExamTypeBadge(test.exam_type)}
          {hasAttempted ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Attempted ({lastScore}/{test.total_marks})
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-500">Unattempted</span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1.5">
          {test.title}
        </h3>
        {test.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
            {test.description}
          </p>
        )}
      </div>

      <div>
        {/* Metadata Footer */}
        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 py-3 text-center text-xs text-slate-600">
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <HelpCircle className="h-3.5 w-3.5 text-teal-600" /> Questions
            </span>
            <span className="font-bold text-slate-900 mt-0.5">{test.total_questions} Qs</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Duration
            </span>
            <span className="font-bold text-slate-900 mt-0.5">{test.duration_minutes} Mins</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Award className="h-3.5 w-3.5 text-emerald-600" /> Total Marks
            </span>
            <span className="font-bold text-slate-900 mt-0.5">{test.total_marks}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center gap-2">
          <Link href={`/tests/${test.id}/start`} className="flex-1">
            <Button variant="brand" size="sm" className="w-full">
              <PlayCircle className="h-4 w-4 mr-1.5" />
              {hasAttempted ? "Retake Test" : "Start Test"}
            </Button>
          </Link>
          {hasAttempted && lastAttemptId && (
            <Link href={`/tests/${test.id}/attempt/${lastAttemptId}/result`}>
              <Button variant="outline" size="sm">
                Scorecard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
