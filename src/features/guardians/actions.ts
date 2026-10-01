"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser } from "@/server/authorization";
import { guardianProfileSchema } from "@/server/validation/guardian";
import { GuardianService } from "@/server/services/GuardianService";

export interface GuardianActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function updateGuardianProfileAction(
  formData: FormData
): Promise<GuardianActionResult> {
  const user = await requireUser();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  const rawData = {
    fullName: formData.get("fullName"),
    phoneNumber: formData.get("phoneNumber"),
    state: formData.get("state"),
  };

  const parsed = guardianProfileSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please check your profile details.",
    };
  }

  const result = await GuardianService.updateProfile({
    guardianId: user.id,
    input: parsed.data,
    actorRole: user.role,
    ipAddress,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to update profile.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
