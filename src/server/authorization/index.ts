import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/server/auth/server";
import type {
  ApplicationRole,
  StudentProfileRecord,
  GuardianProfileRecord,
} from "@/server/db/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: ApplicationRole;
  studentProfile?: StudentProfileRecord | null;
  profile?: (StudentProfileRecord & GuardianProfileRecord) | any;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();

  // 1. In local development only, allow dev session shortcut if configured
  if (process.env.NODE_ENV === "development") {
    const devSessionCookie = cookieStore.get("dev_auth_session")?.value;
    if (devSessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devSessionCookie));
        const safeRole: ApplicationRole =
          parsed.role === "admin"
            ? "admin"
            : parsed.role === "guardian"
            ? "guardian"
            : "student";

        const hexUuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validId = hexUuidRegex.test(parsed.id)
          ? parsed.id
          : safeRole === "admin"
          ? "99999999-9999-9999-9999-999999999999"
          : "11111111-1111-1111-1111-111111111111";

        const devStudentProfile: StudentProfileRecord = {
          id: validId,
          full_name: parsed.name || "Demo Student",
          email: parsed.email,
          phone_number: parsed.phone || null,
          state: parsed.state || "Rajasthan",
          district: parsed.district || "Jaipur",
          target_exam_year: parsed.targetExamYear || 2026,
          gender: "male",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          id: validId,
          email: parsed.email,
          role: safeRole,
          studentProfile: devStudentProfile,
          profile: devStudentProfile,
        };
      } catch {
        // Fall through to real Supabase auth
      }
    }
  }

  // 2. Real Supabase auth verification
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.id) {
      return null;
    }

    // Role MUST be resolved from server-controlled application_roles table
    let role: ApplicationRole = "student";
    const { data: roleData } = await supabase
      .from("application_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const typedRoleData = roleData as { role?: ApplicationRole } | null;
    if (
      typedRoleData?.role === "admin" ||
      typedRoleData?.role === "student" ||
      typedRoleData?.role === "guardian"
    ) {
      role = typedRoleData.role;
    }

    let studentProfile: StudentProfileRecord | null = null;
    const { data: sProfData } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (sProfData) {
      studentProfile = sProfData as StudentProfileRecord;
    }

    // Fallback: check guardian_profiles if legacy
    let legacyGuardianProfile: GuardianProfileRecord | null = null;
    if (!studentProfile) {
      const { data: gProfData } = await supabase
        .from("guardian_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (gProfData) {
        legacyGuardianProfile = gProfData as GuardianProfileRecord;
      }
    }

    const effectiveProfile = studentProfile || legacyGuardianProfile || {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) || "Student",
      email: user.email || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      id: user.id,
      email: user.email || "",
      role,
      studentProfile,
      profile: effectiveProfile,
    };
  } catch (err) {
    console.error("[getCurrentUser] Authentication check failed:", err);
    return null;
  }
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }
  return user;
}

export async function requireStudent(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  return user;
}

export async function requireGuardian(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/unauthorized?reason=admin_required");
  }
  return user;
}

export async function canAccessStudent(
  studentId: string,
  userId: string,
  role: ApplicationRole
): Promise<boolean> {
  if (role === "admin") return true;
  if (studentId === userId) return true;

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("guardian_student_links")
      .select("id")
      .eq("guardian_id", userId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}
