import { notFound, redirect } from "next/navigation";
import { requireUser, canAccessStudent } from "@/server/authorization";
import { StudentService } from "@/server/services/StudentService";
import { StudentForm } from "@/features/students/components/StudentForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Student Profile | ABCD of JNVST",
  description: "Update student details for JNVST preparation.",
};

interface EditStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const hasAccess = await canAccessStudent(id, user.id, user.role);
  if (!hasAccess) {
    redirect("/unauthorized?reason=student_access_denied");
  }

  const student = await StudentService.getStudentById(id);
  if (!student || student.archived_at) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card>
        <CardHeader className="mb-6 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-teal-800" />
            Edit Student Details — {student.full_name}
          </CardTitle>
          <CardDescription>
            Update school demographic data, district, and target exam year.
          </CardDescription>
        </CardHeader>

        <StudentForm initialData={student} isEditing={true} />
      </Card>
    </div>
  );
}
