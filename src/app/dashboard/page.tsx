import Link from "next/link";
import { requireGuardian } from "@/server/authorization";
import { StudentService } from "@/server/services/StudentService";
import { GuardianService } from "@/server/services/GuardianService";
import { StudentCard } from "@/features/students/components/StudentCard";
import { GuardianProfileCard } from "@/features/guardians/components/GuardianProfileCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserPlus, Users, GraduationCap, Sparkles, BookOpen, Info } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guardian Dashboard | ABCD of JNVST",
  description: "Manage registered student profiles and preparation packages.",
};

export default async function DashboardPage() {
  const user = await requireGuardian();
  const guardianProfile = await GuardianService.getProfile(user.id);
  const students = await StudentService.getStudentsForGuardian(user.id);

  const fallbackProfile = guardianProfile || {
    id: user.id,
    full_name: user.profile?.full_name || "Guardian",
    email: user.email,
    phone_number: user.profile?.phone_number || null,
    state: user.profile?.state || "Rajasthan",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Guardian Portal
            </h1>
            <Badge variant="brand">Parent / Guardian</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Welcome, <strong>{fallbackProfile.full_name}</strong>. Manage your student
            profiles and JNVST Class 6 preparation below.
          </p>
        </div>

        <Link href="/dashboard/students/new">
          <Button variant="primary" size="md" className="gap-1.5 shadow-sm">
            <UserPlus className="h-4 w-4" /> Register New Student
          </Button>
        </Link>
      </div>

      {/* Guardian Profile Overview Card */}
      <GuardianProfileCard profile={fallbackProfile} />

      {/* Students Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-800" />
            <h2 className="text-lg font-bold text-slate-900">
              Registered Student Profiles ({students.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Linked to your guardian account</span>
        </div>

        {students.length === 0 ? (
          <Card className="border-2 border-dashed py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900">
              No students registered yet
            </h3>
            <p className="mx-auto mb-4 max-w-sm text-xs text-slate-500">
              Add your child or ward to start preparing them for the Jawahar Navodaya
              Vidyalaya Selection Test Class 6.
            </p>
            <Link href="/dashboard/students/new">
              <Button variant="primary" size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" /> Register First Student
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        )}
      </section>

      {/* Phase 0 Prep Package Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
        <div className="space-y-1">
          <p className="font-semibold">
            ₹500 JNVST Class 6 Preparation Package — Local Phase 0 Mode
          </p>
          <p className="leading-relaxed text-amber-900">
            In this initial phase, payment gateways and live SMS OTPs are simulated
            locally via mock providers. Administrator console allows simulating
            subscriptions and auditing all state transitions.
          </p>
        </div>
      </div>
    </div>
  );
}
