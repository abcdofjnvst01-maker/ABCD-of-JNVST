"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStudentAction, updateStudentAction } from "@/features/students/actions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { INDIAN_STATES_AND_UTS, GUARDIAN_RELATIONSHIPS } from "@/lib/constants";
import type { StudentProfileRecord } from "@/server/db/types";
import { UserPlus, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StudentFormProps {
  initialData?: StudentProfileRecord;
  isEditing?: boolean;
}

export function StudentForm({ initialData, isEditing = false }: StudentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    try {
      if (isEditing && initialData) {
        formData.append("id", initialData.id);
        const result = await updateStudentAction(formData);
        if (!result.success) {
          setError(result.error || "Failed to update student profile.");
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const result = await createStudentAction(formData);
        if (!result.success) {
          setError(result.error || "Failed to register student.");
          if (result.fieldErrors) setFieldErrors(result.fieldErrors);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch {
      setIsLoading(false);
    }
  };

  const stateOptions = INDIAN_STATES_AND_UTS.map((s) => ({ value: s, label: s }));
  const relationshipOptions = GUARDIAN_RELATIONSHIPS.map((r) => ({
    value: r.value,
    label: r.label,
  }));
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" title="Form Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Student Full Name"
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={initialData?.full_name || ""}
          placeholder="e.g. Aarav Sharma"
          hint="Must match student's school records"
          error={fieldErrors.fullName?.[0]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Date of Birth"
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            required
            defaultValue={initialData?.date_of_birth || ""}
            hint="For JNVST Class 6 eligibility check"
            error={fieldErrors.dateOfBirth?.[0]}
          />

          <Select
            label="Gender"
            id="gender"
            name="gender"
            required
            defaultValue={initialData?.gender || "male"}
            options={genderOptions}
            error={fieldErrors.gender?.[0]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="State"
            id="state"
            name="state"
            required
            defaultValue={initialData?.state || "Rajasthan"}
            options={stateOptions}
            error={fieldErrors.state?.[0]}
          />

          <Input
            label="District"
            id="district"
            name="district"
            type="text"
            required
            defaultValue={initialData?.district || ""}
            placeholder="e.g. Jaipur"
            hint="Navodaya quotas are district-specific"
            error={fieldErrors.district?.[0]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Target Exam Year"
            id="targetExamYear"
            name="targetExamYear"
            type="number"
            min={2025}
            max={2032}
            required
            defaultValue={initialData?.target_exam_year || 2027}
            error={fieldErrors.targetExamYear?.[0]}
          />

          {!isEditing && (
            <Select
              label="Your Relationship to Student"
              id="relationship"
              name="relationship"
              required
              defaultValue="parent"
              options={relationshipOptions}
              error={fieldErrors.relationship?.[0]}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <Link href="/dashboard">
            <Button type="button" variant="outline" size="md">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Cancel
            </Button>
          </Link>

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Student Details
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Register Student Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
