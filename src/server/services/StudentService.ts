import { createServerSupabaseClient } from "@/server/auth/server";
import { AuditService } from "./AuditService";
import type {
  StudentProfileRecord,
  StudentEntitlementRecord,
  GuardianStudentLinkRecord,
} from "@/server/db/types";
import type { StudentInput, StudentUpdateInput } from "@/server/validation/student";

export interface StudentWithLink extends StudentProfileRecord {
  relationship: string;
  isPrimary: boolean;
  entitlement?: StudentEntitlementRecord | null;
}

export class StudentService {
  static async getStudentsForGuardian(guardianId: string): Promise<StudentWithLink[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: links, error: linkError } = await supabase
        .from("guardian_student_links")
        .select("student_id, relationship, is_primary")
        .eq("guardian_id", guardianId);

      if (linkError) {
        console.error(
          "[StudentService] Error fetching student links:",
          linkError.message
        );
        return [];
      }

      const typedLinks =
        (links as Array<{
          student_id: string;
          relationship: string;
          is_primary: boolean;
        }>) || [];

      if (typedLinks.length === 0) {
        return [];
      }

      const studentIds = typedLinks.map((l) => l.student_id);
      const { data: students, error: studentError } = await supabase
        .from("student_profiles")
        .select("*")
        .in("id", studentIds)
        .is("archived_at", null);

      if (studentError) {
        console.error(
          "[StudentService] Error fetching student profiles:",
          studentError.message
        );
        return [];
      }

      const typedStudents = (students as StudentProfileRecord[]) || [];
      if (typedStudents.length === 0) {
        return [];
      }

      const { data: entitlements, error: entError } = await supabase
        .from("student_entitlements")
        .select("*")
        .in("student_id", studentIds)
        .eq("status", "active");

      if (entError) {
        console.error(
          "[StudentService] Error fetching student entitlements:",
          entError.message
        );
      }

      const typedEntitlements = (entitlements as StudentEntitlementRecord[]) || [];

      return typedStudents.map((s) => {
        const link = typedLinks.find((l) => l.student_id === s.id);
        const ent = typedEntitlements.find((e) => e.student_id === s.id) || null;
        return {
          ...s,
          relationship: link?.relationship || "parent",
          isPrimary: link?.is_primary ?? true,
          entitlement: ent,
        };
      });
    } catch (err: any) {
      console.error(
        "[StudentService] getStudentsForGuardian failed:",
        err?.message || err
      );
      return [];
    }
  }

  static async getStudentById(studentId: string): Promise<StudentProfileRecord | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (error) {
        console.error("[StudentService] Error fetching student profile:", error.message);
        return null;
      }

      if (!data) return null;
      return data as unknown as StudentProfileRecord;
    } catch (err: any) {
      console.error("[StudentService] getStudentById failed:", err?.message || err);
      return null;
    }
  }

  static async createStudent(params: {
    guardianId: string;
    input: StudentInput;
    actorRole?: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; student?: StudentProfileRecord; error?: string }> {
    const studentId = crypto.randomUUID();
    const linkId = crypto.randomUUID();
    const now = new Date().toISOString();

    const studentRecord: StudentProfileRecord = {
      id: studentId,
      full_name: params.input.fullName,
      date_of_birth: params.input.dateOfBirth,
      district: params.input.district,
      state: params.input.state,
      gender: params.input.gender,
      target_exam_year: params.input.targetExamYear,
      created_at: now,
      updated_at: now,
      archived_at: null,
    };

    const linkRecord: GuardianStudentLinkRecord = {
      id: linkId,
      guardian_id: params.guardianId,
      student_id: studentId,
      relationship: params.input.relationship,
      is_primary: true,
      created_at: now,
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error: sError } = await (supabase.from("student_profiles") as any).insert(
        studentRecord
      );
      if (sError) {
        return {
          success: false,
          error: `Failed to create student record: ${sError.message}`,
        };
      }

      const { error: lError } = await (
        supabase.from("guardian_student_links") as any
      ).insert(linkRecord);
      if (lError) {
        return {
          success: false,
          error: `Failed to link student to guardian: ${lError.message}`,
        };
      }

      await AuditService.log({
        actorId: params.guardianId,
        actorRole: params.actorRole || "guardian",
        action: "STUDENT_PROFILE_CREATED",
        resourceType: "student_profiles",
        resourceId: studentId,
        metadata: {
          fullName: params.input.fullName,
          state: params.input.state,
          district: params.input.district,
          targetExamYear: params.input.targetExamYear,
        },
        ipAddress: params.ipAddress,
      });

      return { success: true, student: studentRecord };
    } catch (err: any) {
      return {
        success: false,
        error: `Database connection error: ${err?.message || "Unknown error"}`,
      };
    }
  }

  static async updateStudent(params: {
    studentId: string;
    guardianId: string;
    input: StudentUpdateInput;
    actorRole?: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    const updateData: Partial<StudentProfileRecord> = {
      ...(params.input.fullName ? { full_name: params.input.fullName } : {}),
      ...(params.input.dateOfBirth ? { date_of_birth: params.input.dateOfBirth } : {}),
      ...(params.input.district ? { district: params.input.district } : {}),
      ...(params.input.state ? { state: params.input.state } : {}),
      ...(params.input.gender ? { gender: params.input.gender } : {}),
      ...(params.input.targetExamYear
        ? { target_exam_year: params.input.targetExamYear }
        : {}),
      updated_at: now,
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("student_profiles") as any)
        .update(updateData)
        .eq("id", params.studentId);

      if (error) {
        return {
          success: false,
          error: `Failed to update student profile: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.guardianId,
        actorRole: params.actorRole || "guardian",
        action: "STUDENT_PROFILE_UPDATED",
        resourceType: "student_profiles",
        resourceId: params.studentId,
        metadata: updateData as Record<string, unknown>,
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

  static async archiveStudent(params: {
    studentId: string;
    guardianId: string;
    actorRole?: string;
    ipAddress?: string | null;
  }): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("student_profiles") as any)
        .update({ archived_at: now })
        .eq("id", params.studentId);

      if (error) {
        return {
          success: false,
          error: `Failed to archive student profile: ${error.message}`,
        };
      }

      await AuditService.log({
        actorId: params.guardianId,
        actorRole: params.actorRole || "guardian",
        action: "STUDENT_PROFILE_ARCHIVED",
        resourceType: "student_profiles",
        resourceId: params.studentId,
        metadata: { archivedAt: now },
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
}
