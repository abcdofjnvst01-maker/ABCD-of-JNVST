import { createServerSupabaseClient } from "@/server/auth/server";
import { AuditService } from "./AuditService";
import { APP_CONFIG } from "@/lib/constants";
import type {
  StudentProfileRecord,
  GuardianProfileRecord,
  SubscriptionPlanRecord,
  AuditLogRecord,
  GuardianStudentLinkRecord,
  StudentEntitlementRecord,
} from "@/server/db/types";

export interface AdminStudentSummary {
  student: StudentProfileRecord;
  guardian: GuardianProfileRecord | null;
  relationship: string;
  hasActiveEntitlement: boolean;
}

export interface PlatformStats {
  totalStudents: number;
  maxCapacity: number;
  totalGuardians: number;
  activeEntitlements: number;
  stateDistribution: Record<string, number>;
}

export class AdminService {
  static async getPlatformStats(): Promise<PlatformStats> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data: students, error: sErr } = await supabase
        .from("student_profiles")
        .select("id, state")
        .is("archived_at", null);

      if (sErr) {
        console.error("[AdminService] Error fetching student stats:", sErr.message);
      }

      const { count: guardianCount, error: gErr } = await supabase
        .from("guardian_profiles")
        .select("*", { count: "exact", head: true });

      if (gErr) {
        console.error("[AdminService] Error fetching guardian stats:", gErr.message);
      }

      const { count: entCount, error: eErr } = await supabase
        .from("student_entitlements")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (eErr) {
        console.error("[AdminService] Error fetching entitlement stats:", eErr.message);
      }

      const studentList = (students as Array<{ id: string; state: string }>) || [];
      const stateDist: Record<string, number> = {};
      for (const s of studentList) {
        stateDist[s.state] = (stateDist[s.state] || 0) + 1;
      }

      return {
        totalStudents: studentList.length,
        maxCapacity: APP_CONFIG.targetCapacity,
        totalGuardians: guardianCount || 0,
        activeEntitlements: entCount || 0,
        stateDistribution: stateDist,
      };
    } catch (err: any) {
      console.error("[AdminService] getPlatformStats failed:", err?.message || err);
      return {
        totalStudents: 0,
        maxCapacity: APP_CONFIG.targetCapacity,
        totalGuardians: 0,
        activeEntitlements: 0,
        stateDistribution: {},
      };
    }
  }

  static async getAllStudents(): Promise<AdminStudentSummary[]> {
    try {
      const supabase = await createServerSupabaseClient();

      const { data: students, error: sErr } = await supabase
        .from("student_profiles")
        .select("*")
        .is("archived_at", null)
        .order("created_at", { ascending: false });

      if (sErr) {
        console.error("[AdminService] Error fetching students:", sErr.message);
        return [];
      }

      const typedStudents = (students as StudentProfileRecord[]) || [];
      if (typedStudents.length === 0) {
        return [];
      }

      const { data: links } = await supabase.from("guardian_student_links").select("*");
      const typedLinks = (links as GuardianStudentLinkRecord[]) || [];

      const { data: guardians } = await supabase.from("guardian_profiles").select("*");
      const typedGuardians = (guardians as GuardianProfileRecord[]) || [];

      const { data: entitlements } = await supabase
        .from("student_entitlements")
        .select("*")
        .eq("status", "active");
      const typedEntitlements = (entitlements as StudentEntitlementRecord[]) || [];

      return typedStudents.map((s) => {
        const link = typedLinks.find((l) => l.student_id === s.id);
        const guardian = link
          ? typedGuardians.find((g) => g.id === link.guardian_id) || null
          : null;
        const hasActiveEntitlement = typedEntitlements.some((e) => e.student_id === s.id);

        return {
          student: s,
          guardian,
          relationship: link?.relationship || "parent",
          hasActiveEntitlement,
        };
      });
    } catch (err: any) {
      console.error("[AdminService] getAllStudents failed:", err?.message || err);
      return [];
    }
  }

  static async getSubscriptionPlans(): Promise<SubscriptionPlanRecord[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_inr", { ascending: true });

      if (error) {
        console.error("[AdminService] Error fetching plans:", error.message);
        return [];
      }

      return (data as SubscriptionPlanRecord[]) || [];
    } catch (err: any) {
      console.error("[AdminService] getSubscriptionPlans failed:", err?.message || err);
      return [];
    }
  }

  static async grantEntitlement(params: {
    adminId: string;
    studentId: string;
    planId: string;
    validityDays?: number;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const days = params.validityDays || APP_CONFIG.defaultSubscriptionDurationDays;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const entitlementId = crypto.randomUUID();

    const entitlement: StudentEntitlementRecord = {
      id: entitlementId,
      student_id: params.studentId,
      plan_id: params.planId,
      status: "active",
      starts_at: now.toISOString(),
      expires_at: expiresAt,
      granted_by: params.adminId,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("student_entitlements") as any).insert(
        entitlement
      );

      if (error) {
        return {
          success: false,
          error: `Database error granting entitlement: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.adminId,
        actorRole: "admin",
        action: "ADMIN_GRANTED_STUDENT_ENTITLEMENT",
        resourceType: "student_entitlements",
        resourceId: entitlementId,
        metadata: {
          studentId: params.studentId,
          planId: params.planId,
          validityDays: days,
        },
        ipAddress: params.ipAddress,
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async getAuditLogs(limit = 50): Promise<AuditLogRecord[]> {
    return AuditService.getLogs(limit);
  }
}
