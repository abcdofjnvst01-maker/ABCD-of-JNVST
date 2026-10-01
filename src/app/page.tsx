import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { APP_CONFIG } from "@/lib/constants";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Calculator,
  Languages,
  ShieldCheck,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm sm:p-12 md:p-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Dedicated Cohort for 500 Class 6 Aspirants</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Master the <span className="text-teal-800">JNVST Class 6</span> Entrance
              with Confidence.
            </h1>

            <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
              A parent-managed, structured learning system tailored specifically for
              Jawahar Navodaya Vidyalaya Selection Test (JNVST). High quality chapter
              practice, timed mock exams, and in-depth performance clarity for just ₹500.
            </p>

            <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
              <Link href="/signup">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md sm:w-auto"
                >
                  Enroll as Guardian <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Guardian Sign In
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                <span>Parent-Controlled Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-teal-700" />
                <span>500 Selected Seats</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-700">₹500</span>
                <span>All-Inclusive 1-Year Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Exam Sections Breakdown */}
      <section className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <Badge variant="brand">Targeted Curriculum</Badge>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Complete JNVST Class 6 Syllabus
          </h2>
          <p className="text-sm text-slate-600">
            Aligned with the official Navodaya Vidyalaya Samiti pattern.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Section 1: Mental Ability */}
          <Card className="border-t-4 border-t-teal-700 transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              Mental Ability (MAT)
            </h3>
            <p className="mb-3 text-xs font-semibold text-teal-800">
              50% Weightage (40 Questions / 50 Marks)
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Pattern completion, odd-one-out, figure matching, mirror imaging, paper
              folding, embedded figures, and spatial reasoning.
            </p>
          </Card>

          {/* Section 2: Arithmetic */}
          <Card className="border-t-4 border-t-amber-600 transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Arithmetic Test</h3>
            <p className="mb-3 text-xs font-semibold text-amber-800">
              25% Weightage (20 Questions / 25 Marks)
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Number systems, LCM & HCF, fractions, decimals, unitary method, percentage,
              profit & loss, simple interest, and geometry basics.
            </p>
          </Card>

          {/* Section 3: Language */}
          <Card className="border-t-4 border-t-teal-700 transition-shadow hover:shadow-md">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
              <Languages className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-slate-900">Language Test</h3>
            <p className="mb-3 text-xs font-semibold text-teal-800">
              25% Weightage (20 Questions / 25 Marks)
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              Reading comprehension passages, vocabulary, contextual understanding,
              grammatical inference, and sentence structures.
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing / Plan Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white sm:p-12 md:p-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">
                Transparent & Affordable
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                ₹500 Preparation Package
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                Designed to be accessible to every family across districts without
                recurring fees or deceptive upsells. One single payment unlocks
                comprehensive preparation for the full academic year.
              </p>

              <ul className="space-y-2.5 pt-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>Full coverage of all 3 JNVST exam sections</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>Multi-student profile support per guardian</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>365-day access validity for Class 6 exam</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>Detailed district-level progress insights</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 text-slate-900 shadow-xl sm:p-8">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    JNVST Class 6 Full Prep
                  </h4>
                  <p className="text-xs text-slate-500">1-Year Complete Enrollment</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-amber-600">₹500</span>
                  <span className="block text-xs text-slate-500">one-time / student</span>
                </div>
              </div>

              <div className="space-y-3 py-6 text-xs text-slate-600">
                <p className="leading-relaxed">
                  ✓ Includes future mobile app synchronization
                </p>
                <p className="leading-relaxed">
                  ✓ Strict privacy: Student records are private to the guardian
                </p>
                <p className="leading-relaxed">
                  ✓ Mock sandbox active in Phase 0 development
                </p>
              </div>

              <Link href="/signup" className="block">
                <Button variant="primary" size="lg" className="w-full text-base">
                  Get Started for ₹500
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
