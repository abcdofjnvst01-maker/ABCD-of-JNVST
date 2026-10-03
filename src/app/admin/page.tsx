import Link from "next/link";
import { requireAdmin } from "@/server/authorization";
import { AdminService } from "@/server/services/AdminService";
import { AdminStudentTable } from "@/features/admin/components/AdminStudentTable";
import { AuditLogViewer } from "@/features/admin/components/AuditLogViewer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShieldAlert,
  Users,
  Award,
  GraduationCap,
  Activity,
  Layers,
  BookOpen,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console | ABCD of JNVST",
  description: "Platform management, cohort capacity, and audit logs.",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = await AdminService.getPlatformStats();
  const students = await AdminService.getAllStudents();
  const plans = await AdminService.getSubscriptionPlans();
  const logs = await AdminService.getAuditLogs(30);

  const capacityPercentage = Math.round((stats.totalStudents / stats.maxCapacity) * 100);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Admin Top Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Administrator Console
            </h1>
            <Badge variant="accent">Super Admin</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Managing cohort capacity, student enrollments, ₹500 subscription plans, and
            security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/questions">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
              <BookOpen className="h-4 w-4" /> Manage Question Bank
            </Button>
          </Link>
        </div>
      </div>

      {/* Cohort 500 & Platform Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-teal-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Enrolled
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {stats.totalStudents}{" "}
                <span className="text-xs font-normal text-slate-500">/ 500</span>
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
            <span className="mt-1 block text-[11px] text-slate-500">
              {capacityPercentage}% of 500 target student capacity
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active ₹500 Plans
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {stats.activeEntitlements}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Students with active preparation access
          </p>
        </Card>

        <Card className="border-l-4 border-l-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Guardians
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {stats.totalGuardians}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Registered parent/guardian accounts
          </p>
        </Card>

        <Card className="border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Plan Price
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-teal-900">
                ₹{plans[0]?.price_inr || 500}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">1-Year JNVST Class 6 Full Prep</p>
        </Card>
      </div>

      {/* Student Management Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Student Enrolments & Entitlement Control
          </h2>
          <span className="text-xs text-slate-500">
            Administrator role verified from database
          </span>
        </div>
        <AdminStudentTable students={students} plans={plans} />
      </section>

      {/* Audit Log Trail */}
      <section className="space-y-3">
        <AuditLogViewer logs={logs} />
      </section>
    </div>
  );
}
