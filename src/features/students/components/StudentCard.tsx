"use client";

import { useState } from "react";
import Link from "next/link";
import { archiveStudentAction } from "@/features/students/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, calculateAge } from "@/lib/utils";
import type { StudentWithLink } from "@/server/services/StudentService";
import {
  User,
  MapPin,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";

interface StudentCardProps {
  student: StudentWithLink;
}

export function StudentCard({ student }: StudentCardProps) {
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (
      confirm(
        `Are you sure you want to archive profile for ${student.full_name}? You can reactivate it later.`
      )
    ) {
      setIsArchiving(true);
      await archiveStudentAction(student.id);
      setIsArchiving(false);
    }
  };

  const hasActiveEntitlement = student.entitlement?.status === "active";
  const age = student.date_of_birth ? calculateAge(student.date_of_birth) : "—";

  return (
    <Card className="transition-all hover:border-slate-300">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-800">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">{student.full_name}</h4>
              <Badge variant="neutral" className="capitalize">
                {student.relationship}
              </Badge>
              {student.gender && (
                <Badge variant="neutral" className="capitalize">
                  {student.gender}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {student.district || student.state}, {student.state}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                DOB: {student.date_of_birth ? formatDate(student.date_of_birth) : "—"} ({age} yrs)
              </span>
            </div>
          </div>
        </div>

        {/* Subscription / Entitlement Badge */}
        <div>
          {hasActiveEntitlement ? (
            <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Full Prep Active</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-xs">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Pending ₹500 Prep Package</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Target & Learning Path preview */}
      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs sm:grid-cols-2">
        <div>
          <span className="block text-slate-500">Target Selection Test:</span>
          <strong className="font-semibold text-slate-900">
            JNVST Class 6 — {student.target_exam_year}
          </strong>
        </div>
        <div>
          <span className="block text-slate-500">Syllabus Focus:</span>
          <span className="font-medium text-slate-700">
            Mental Ability (50%) • Arithmetic (25%) • Language (25%)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/students/${student.id}`}>
            <Button variant="outline" size="sm" className="gap-1 text-slate-700">
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={handleArchive}
            isLoading={isArchiving}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Archive
          </Button>
        </div>

        {!hasActiveEntitlement && (
          <div className="flex items-center gap-2">
            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
              ₹500 / 1-Year
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
