import { createServerSupabaseClient } from "@/server/auth/server";
import { AuditService } from "./AuditService";
import type { GuardianProfileRecord } from "@/server/db/types";
import type { GuardianProfileInput } from "@/server/validation/guardian";

export class GuardianService {
  static async getProfile(guardianId: string): Promise<GuardianProfileRecord | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("guardian_profiles")
      .select("*")
      .eq("id", guardianId)
      .maybeSingle();

    if (!data) return null;
    return data as unknown as GuardianProfileRecord;
  }

  static async updateProfile(params: {
    guardianId: string;
    input: GuardianProfileInput;
    actorRole?: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    const updateData = {
      full_name: params.input.fullName,
      phone_number: params.input.phoneNumber || null,
      state: params.input.state,
      updated_at: now,
    };

    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase.from("guardian_profiles") as any)
      .update(updateData)
      .eq("id", params.guardianId);

    if (error) {
      return {
        success: false,
        error: `Database error updating guardian profile: ${error.message}`,
      };
    }

    await AuditService.log({
      actorId: params.guardianId,
      actorRole: params.actorRole || "guardian",
      action: "GUARDIAN_PROFILE_UPDATED",
      resourceType: "guardian_profiles",
      resourceId: params.guardianId,
      metadata: updateData,
      ipAddress: params.ipAddress,
    });

    return { success: true };
  }
}
