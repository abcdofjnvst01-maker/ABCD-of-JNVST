"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser, canAccessStudent } from "@/server/authorization";
import { studentSchema, studentUpdateSchema } from "@/server/validation/student";
import { StudentService } from "@/server/services/StudentService";

export interface StudentActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  studentId?: string;
}

export async function createStudentAction(
  formData: FormData
): Promise<StudentActionResult> {
  const user = await requireUser();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const rawData = {
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    district: formData.get("district"),
    state: formData.get("state"),
    gender: formData.get("gender"),
    targetExamYear: formData.get("targetExamYear"),
    relationship: formData.get("relationship"),
  };

  const parsed = studentSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please check the entered student information.",
    };
  }

  const result = await StudentService.createStudent({
    guardianId: user.id,
    input: parsed.data,
    actorRole: user.role,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to create student profile.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/students");
  return {
    success: true,
    studentId: result.student?.id,
  };
}

export async function updateStudentAction(
  formData: FormData
): Promise<StudentActionResult> {
  const user = await requireUser();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const rawData = {
    id: formData.get("id"),
    fullName: formData.get("fullName"),
    dateOfBirth: formData.get("dateOfBirth"),
    district: formData.get("district"),
    state: formData.get("state"),
    gender: formData.get("gender"),
    targetExamYear: formData.get("targetExamYear"),
  };

  const parsed = studentUpdateSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please review the updated details.",
    };
  }

  const hasAccess = await canAccessStudent(parsed.data.id, user.id, user.role);
  if (!hasAccess) {
    return {
      success: false,
      error: "You are not authorized to update this student profile.",
    };
  }

  const result = await StudentService.updateStudent({
    studentId: parsed.data.id,
    guardianId: user.id,
    input: parsed.data,
    actorRole: user.role,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to update student profile.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/students/${parsed.data.id}`);
  return {
    success: true,
    studentId: parsed.data.id,
  };
}

export async function archiveStudentAction(
  studentId: string
): Promise<StudentActionResult> {
  const user = await requireUser();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const hasAccess = await canAccessStudent(studentId, user.id, user.role);
  if (!hasAccess) {
    return {
      success: false,
      error: "Forbidden. You cannot delete or archive this student profile.",
    };
  }

  const result = await StudentService.archiveStudent({
    studentId,
    guardianId: user.id,
    actorRole: user.role,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to archive student profile.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/students");
  return {
    success: true,
  };
}
