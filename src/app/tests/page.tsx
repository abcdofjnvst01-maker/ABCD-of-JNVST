import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, Clock, Sparkles, PlusCircle } from "lucide-react";
import { requireUser } from "@/server/authorization";
import { MockTestService } from "@/server/services/MockTestService";
import { StudentService } from "@/server/services/StudentService";
import { TestCard } from "@/features/tests/components/TestCard";
import { Button } from "@/components/ui/Button";

export default async function TestsDiscoveryPage() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  // Fetch tests
  const tests = await MockTestService.getMockTests({
    isPublishedOnly: !isAdmin,
  });

  // Fetch student profiles for this guardian
  const students = await StudentService.getStudentsForGuardian(user.id);

  // Group by Exam Type
  const fullMocks = tests.filter((t) => t.exam_type === "full_mock");
  const sectionals = tests.filter((t) => t.exam_type === "sectional");
  const topicDrills = tests.filter((t) => t.exam_type === "topic_drill");

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                JNVST Class 6 Simulator
              </span>
              <span className="text-xs text-slate-500">Official Exam Pattern</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              Mock Tests & Practice Engine (अभ्यास परीक्षा)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Practice timed 80-question full-length exams, sectional tests, and virtual OMR sheet simulations.
            </p>
          </div>

          {isAdmin && (
            <Link href="/admin/questions">
              <Button variant="brand" size="sm">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Manage Question Bank
              </Button>
            </Link>
          )}
        </div>

        {/* Full-Length Mock Exams */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-bold text-slate-900">
              Full-Length Mock Exams (पूर्ण मॉक टेस्ट)
            </h2>
          </div>
          {fullMocks.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No full-length mock exams available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {fullMocks.map((t) => (
                <TestCard key={t.id} test={t} />
              ))}
            </div>
          )}
        </div>

        {/* Speed Drills & Topic Practice */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Speed Drills & Topic Practice (गति एवं विषय अभ्यास)
            </h2>
          </div>
          {topicDrills.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No speed drills available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topicDrills.map((t) => (
                <TestCard key={t.id} test={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
