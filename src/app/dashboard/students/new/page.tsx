import { requireGuardian } from "@/server/authorization";
import { StudentForm } from "@/features/students/components/StudentForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Student Profile | ABCD of JNVST",
  description:
    "Add a new student profile linked to your guardian account for JNVST preparation.",
};

export default async function NewStudentPage() {
  await requireGuardian();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card>
        <CardHeader className="mb-6 border-b border-slate-100 pb-4">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-800" />
            Register Student for JNVST Class 6
          </CardTitle>
          <CardDescription>
            Enter your child&apos;s details according to their school records. Navodaya
            Vidyalaya selection is district-specific.
          </CardDescription>
        </CardHeader>

        <StudentForm isEditing={false} />
      </Card>
    </div>
  );
}
