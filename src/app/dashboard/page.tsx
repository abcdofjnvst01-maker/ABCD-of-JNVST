import Link from "next/link";
import { requireUser } from "@/server/authorization";
import { MockTestService } from "@/server/services/MockTestService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  PlayCircle,
  Clock,
  CheckCircle,
  Brain,
  Calculator,
  Languages,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Dashboard | ABCD of JNVST",
  description: "Track your JNVST Class 6 mock test scores, practice sections, and performance.",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const attempts = await MockTestService.getAttemptsForStudent(user.id);

  const studentName = user.profile?.full_name || "Navodaya Aspirant";
  const studentState = user.profile?.state || "Rajasthan";
  const targetYear = user.profile?.target_exam_year || 2026;

  const completedAttempts = attempts.filter((a) => a.status === "completed");
  const totalCompleted = completedAttempts.length;
  const avgScore =
    totalCompleted > 0
      ? (
          completedAttempts.reduce((acc, curr) => acc + Number(curr.score || 0), 0) /
          totalCompleted
        ).toFixed(1)
      : null;

  const avgAccuracy =
    totalCompleted > 0
      ? (
          completedAttempts.reduce(
            (acc, curr) => acc + Number(curr.accuracy_percentage || 0),
            0
          ) / totalCompleted
        ).toFixed(1)
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Top Banner & Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-teal-900 via-teal-800 to-teal-950 p-6 text-white shadow-md sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-xs border border-amber-300/30">
                <Sparkles className="h-3.5 w-3.5" /> JNVST Class 6 Entrance Prep
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-400/30">
                ₹500 Package Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Welcome, {studentName}!
            </h1>
            <p className="max-w-xl text-xs text-teal-100/90 sm:text-sm">
              Target Exam Year: <strong>{targetYear}</strong> | State: <strong>{studentState}</strong>.
              Master the 80 questions across Mental Ability, Arithmetic, and Language.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/tests">
              <Button
                variant="brand"
                size="lg"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Full Mock Test
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Tests Taken</p>
              <p className="text-xl font-black text-slate-900">{totalCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Average Score</p>
              <p className="text-xl font-black text-slate-900">
                {avgScore ? `${avgScore} / 100` : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Accuracy Rate</p>
              <p className="text-xl font-black text-slate-900">
                {avgAccuracy ? `${avgAccuracy}%` : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">JNVST Pattern</p>
              <p className="text-xl font-black text-slate-900">80 Qs (100 M)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 3 Subject Breakdown Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-800" />
            <h2 className="text-lg font-bold text-slate-900">Exam Sections & Syllabus</h2>
          </div>
          <Link href="/tests" className="text-xs font-bold text-teal-800 hover:underline">
            View All Tests →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Section 1: MAT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                <Brain className="h-5 w-5" />
              </div>
              <Badge variant="brand">Section 1</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Mental Ability Test (MAT)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              मानसिक योग्यता परीक्षा (40 Questions | 50 Marks)
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              10 non-verbal reasoning topics including Odd Man Out, Mirror Images, Pattern Completion, and Embedded Figures.
            </p>
          </div>

          {/* Section 2: Arithmetic */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <Calculator className="h-5 w-5" />
              </div>
              <Badge variant="warning">Section 2</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Arithmetic Test
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              अंकगणित परीक्षा (20 Questions | 25 Marks)
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Number systems, fractions, LCM & HCF, percentages, profit & loss, simple interest, and unitary method.
            </p>
          </div>

          {/* Section 3: Language */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-hover hover:border-teal-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-800">
                <Languages className="h-5 w-5" />
              </div>
              <Badge variant="accent">Section 3</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Language Test
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              भाषा परीक्षा (20 Questions | 25 Marks)
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              4 reading comprehension passages (अनुच्छेद) testing contextual understanding, vocabulary, and grammar.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Test Attempts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-800" />
            <h2 className="text-lg font-bold text-slate-900">
              My Mock Test Attempts ({attempts.length})
            </h2>
          </div>
          <Link href="/tests">
            <Button variant="outline" size="sm">
              <PlayCircle className="mr-1.5 h-4 w-4" /> Practice Another Test
            </Button>
          </Link>
        </div>

        {attempts.length === 0 ? (
          <Card className="border-2 border-dashed py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              No test attempts yet!
            </h3>
            <p className="mx-auto mb-4 max-w-sm text-xs text-slate-500">
              Take your first full-length 80-question JNVST Mock Test with bilingual support and virtual OMR sheet simulation.
            </p>
            <Link href="/tests">
              <Button variant="primary" size="sm">
                <PlayCircle className="mr-1.5 h-4 w-4" /> Start First Mock Test
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-teal-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {attempt.test?.title || "JNVST Full Mock Test"}
                    </span>
                    <Badge variant={attempt.status === "completed" ? "brand" : "warning"}>
                      {attempt.status === "completed" ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.round((attempt.time_spent_seconds || 0) / 60)} mins spent
                    </span>
                    <span>
                      Date: {new Date(attempt.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {attempt.status === "completed" && (
                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-700">
                        {attempt.score} <span className="text-xs text-slate-500 font-normal">/ {attempt.total_marks}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500">
                        {attempt.accuracy_percentage}% Accuracy
                      </div>
                    </div>
                  )}

                  <Link href={`/tests/${attempt.test_id}`}>
                    <Button variant="outline" size="sm" className="font-semibold">
                      {attempt.status === "completed" ? "Retake Test" : "Resume"}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
