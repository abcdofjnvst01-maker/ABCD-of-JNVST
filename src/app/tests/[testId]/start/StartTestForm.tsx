"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startTestAttemptAction } from "@/features/tests/actions";

interface StartTestFormProps {
  testId: string;
  studentId: string;
  studentName?: string;
}

export function StartTestForm({ testId, studentId, studentName }: StartTestFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await startTestAttemptAction(studentId, testId);
      if (res.success && res.data?.attemptId) {
        router.push(`/tests/${testId}/attempt/${res.data.attemptId}`);
      } else {
        setError(res.error || "Could not launch test. Please try again.");
        setIsLoading(false);
      }
    } catch (e: any) {
      setError(e.message || "Failed to start test.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-800 text-white font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Candidate (परीक्षार्थी)
            </span>
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              {studentName || "Registered Student"}
            </span>
          </div>
        </div>

        <div>
          <Button
            variant="brand"
            size="lg"
            onClick={handleStart}
            isLoading={isLoading}
            className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 shadow-sm"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Launch Test Simulator (परीक्षा शुरू करें)
          </Button>
        </div>
      </div>
    </div>
  );
}
