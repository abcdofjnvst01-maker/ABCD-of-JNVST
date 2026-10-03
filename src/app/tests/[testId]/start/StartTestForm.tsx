"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { startTestAttemptAction } from "@/features/tests/actions";
import type { StudentWithLink } from "@/server/services/StudentService";

interface StartTestFormProps {
  testId: string;
  students: StudentWithLink[];
}

export function StartTestForm({ testId, students }: StartTestFormProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedStudentId) {
      setError("Please select a student profile to begin the test.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await startTestAttemptAction(selectedStudentId, testId);
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

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-xs font-semibold text-amber-900 mb-3">
          No student profile found on this guardian account. Please add a student profile first to take tests.
        </p>
        <Link href="/dashboard/students/new">
          <Button variant="brand" size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Student Profile
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
            Taking Exam As (परीक्षार्थी चुनें):
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-xs focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} ({student.state}, {student.district}) - Target {student.target_exam_year}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 sm:pt-4">
          <Button
            variant="brand"
            size="lg"
            onClick={handleStart}
            isLoading={isLoading}
            className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold"
          >
            <PlayCircle className="h-5 w-5 mr-2" />
            Launch Test Simulator
          </Button>
        </div>
      </div>
    </div>
  );
}
