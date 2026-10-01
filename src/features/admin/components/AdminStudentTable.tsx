"use client";

import { useState } from "react";
import { adminGrantEntitlementAction } from "@/features/admin/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { AdminStudentSummary } from "@/server/services/AdminService";
import type { SubscriptionPlanRecord } from "@/server/db/types";
import { CheckCircle2, ShieldAlert, Sparkles, User } from "lucide-react";

interface AdminStudentTableProps {
  students: AdminStudentSummary[];
  plans: SubscriptionPlanRecord[];
}

export function AdminStudentTable({ students, plans }: AdminStudentTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "pending">("all");
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

  const defaultPlan = plans[0] || {
    id: "c0000000-0000-0000-0000-000000000001",
    price_inr: 500,
  };

  const filteredStudents = students.filter((item) => {
    if (activeTab === "active") return item.hasActiveEntitlement;
    if (activeTab === "pending") return !item.hasActiveEntitlement;
    return true;
  });

  const handleGrant = async (studentId: string) => {
    setLoadingStudentId(studentId);
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("planId", defaultPlan.id);
    await adminGrantEntitlementAction(formData);
    setLoadingStudentId(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "active"
              ? "bg-emerald-700 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active Subscriptions ({students.filter((s) => s.hasActiveEntitlement).length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "pending"
              ? "bg-amber-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pending / Unpaid ({students.filter((s) => !s.hasActiveEntitlement).length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">State & District</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Target Year</th>
              <th className="px-4 py-3">Entitlement Status</th>
              <th className="px-4 py-3 text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  No student records matching this filter.
                </td>
              </tr>
            ) : (
              filteredStudents.map((item) => (
                <tr
                  key={item.student.id}
                  className="transition-colors hover:bg-slate-50/60"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {item.student.full_name}
                    </div>
                    <div className="text-xs text-slate-400">
                      DOB: {formatDate(item.student.date_of_birth)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{item.student.district}</div>
                    <div className="text-xs text-slate-500">{item.student.state}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {item.guardian?.full_name || "Unlinked"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.guardian?.email || "-"} • {item.relationship}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">
                      JNVST {item.student.target_exam_year}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.hasActiveEntitlement ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active (₹500 Plan)
                      </Badge>
                    ) : (
                      <Badge variant="warning">Pending ₹500 Package</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!item.hasActiveEntitlement ? (
                      <Button
                        size="sm"
                        variant="brand"
                        onClick={() => handleGrant(item.student.id)}
                        isLoading={loadingStudentId === item.student.id}
                      >
                        <Sparkles className="mr-1 h-3.5 w-3.5" /> Grant ₹500 Access
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700">
                        Enrolled
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
