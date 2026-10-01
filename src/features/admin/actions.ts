"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdmin } from "@/server/authorization";
import { AdminService } from "@/server/services/AdminService";

export async function adminGrantEntitlementAction(formData: FormData) {
  const admin = await requireAdmin();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const studentId = formData.get("studentId") as string;
  const planId = formData.get("planId") as string;

  if (!studentId || !planId) {
    return { success: false, error: "Missing studentId or planId" };
  }

  const result = await AdminService.grantEntitlement({
    adminId: admin.id,
    studentId,
    planId,
    validityDays: 365,
    ipAddress,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/dashboard");
  return result;
}
