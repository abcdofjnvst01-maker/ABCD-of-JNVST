import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, HelpCircle, Award, CheckCircle, ArrowLeft, PlayCircle, ShieldCheck } from "lucide-react";
import { requireUser } from "@/server/authorization";
import { MockTestService } from "@/server/services/MockTestService";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StartTestForm } from "./StartTestForm";

interface StartPageProps {
  params: Promise<{ testId: string }>;
}

export default async function TestStartPage({ params }: StartPageProps) {
  const { testId } = await params;
  const user = await requireUser();

  const test = await MockTestService.getMockTestById(testId);
  if (!test) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Tests
        </Link>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand">{test.exam_type.replace("_", " ")}</Badge>
              <span className="text-xs font-semibold text-slate-500">JNVST Class 6 Pattern</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{test.title}</h1>
            {test.description && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{test.description}</p>}
          </div>

          {/* Key Parameters */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-teal-50/50 p-4 sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <Clock className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-xs text-slate-500">Duration</span>
              <span className="font-bold text-slate-900">{test.duration_minutes} Minutes</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <HelpCircle className="h-5 w-5 text-teal-600 mb-1" />
              <span className="text-xs text-slate-500">Total Questions</span>
              <span className="font-bold text-slate-900">{test.total_questions} Questions</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <Award className="h-5 w-5 text-emerald-600 mb-1" />
              <span className="text-xs text-slate-500">Total Marks</span>
              <span className="font-bold text-slate-900">{test.total_marks} Marks</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 text-center">
              <ShieldCheck className="h-5 w-5 text-purple-600 mb-1" />
              <span className="text-xs text-slate-500">Marking Scheme</span>
              <span className="font-bold text-emerald-700">+1.25 / 0 (No -ve)</span>
            </div>
          </div>

          {/* Exam Instructions */}
          <div className="mt-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Exam Instructions & Guidelines (परीक्षा निर्देश)
            </h3>
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-relaxed text-slate-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700">1.</span>
                <span>The exam consists of 3 sections: Mental Ability (40 Qs), Arithmetic (20 Qs), and Language (20 Qs).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700">2.</span>
                <span>Each correct answer awards <strong>+1.25 marks</strong>. There is <strong>NO negative marking</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700">3.</span>
                <span>You can switch between <strong>English and Hindi</strong> at any time during the test using the language button.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700">4.</span>
                <span>You can also toggle to <strong>Virtual OMR Sheet mode</strong> to practice bubbling your answers as in the pen-and-paper exam.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700">5.</span>
                <span>The test will automatically submit when the countdown timer reaches 00:00.</span>
              </div>
            </div>
          </div>

          {/* Direct Candidate & Start Action Form */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <StartTestForm
              testId={test.id}
              studentId={user.id}
              studentName={user.profile?.full_name || "Student"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
