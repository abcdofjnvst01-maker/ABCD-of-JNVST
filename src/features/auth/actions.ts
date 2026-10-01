"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerSupabaseClient } from "@/server/auth/server";
import {
  signInSchema,
  signUpSchema,
  resetPasswordRequestSchema,
} from "@/server/validation/auth";
import { AuditService } from "@/server/services/AuditService";

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  redirectUrl?: string;
}

export async function signInAction(
  arg1: ActionResult | FormData | null,
  arg2?: FormData
): Promise<ActionResult> {
  const formData =
    arg2 instanceof FormData ? arg2 : arg1 instanceof FormData ? arg1 : null;

  if (!formData) {
    return {
      success: false,
      error: "Invalid form submission.",
    };
  }

  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please fix the errors in the form.",
    };
  }

  const { email, password } = parsed.data;
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await AuditService.log({
        actorRole: "anonymous",
        action: "AUTH_SIGN_IN_FAILED",
        resourceType: "auth.users",
        metadata: { email, reason: error.message },
        ipAddress,
      });

      return {
        success: false,
        error:
          error.message || "Invalid email or password. Please verify your credentials.",
      };
    }

    if (data.user) {
      // Check role to determine redirect
      const { data: roleData } = await supabase
        .from("application_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const userRole = (roleData as { role?: string } | null)?.role;

      await AuditService.log({
        actorId: data.user.id,
        actorRole: userRole || "guardian",
        action: "AUTH_SIGN_IN_SUCCESS",
        resourceType: "auth.users",
        resourceId: data.user.id,
        ipAddress,
      });

      revalidatePath("/", "layout");
      const redirectUrl = userRole === "admin" ? "/admin" : "/dashboard";
      return { success: true, redirectUrl };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Unable to connect to authentication service.",
    };
  }

  return {
    success: false,
    error: "Invalid email or password. Please verify your credentials.",
  };
}

export async function signUpAction(
  arg1: ActionResult | FormData | null,
  arg2?: FormData
): Promise<ActionResult> {
  const formData =
    arg2 instanceof FormData ? arg2 : arg1 instanceof FormData ? arg1 : null;

  if (!formData) {
    return {
      success: false,
      error: "Invalid form submission.",
    };
  }

  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    state: formData.get("state"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please correct the form fields.",
    };
  }

  const { fullName, email, phoneNumber, state, password } = parsed.data;
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");
  const now = new Date().toISOString();

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Registration could not be completed.",
      };
    }

    if (data.user) {
      const { error: profError } = await (
        supabase.from("guardian_profiles") as any
      ).insert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone_number: phoneNumber || null,
        state,
        created_at: now,
        updated_at: now,
      });

      if (profError) {
        console.error(
          "[signUpAction] Guardian profile creation failed:",
          profError.message
        );
      }

      const { error: roleError } = await (
        supabase.from("application_roles") as any
      ).insert({
        user_id: data.user.id,
        role: "guardian",
      });

      if (roleError) {
        console.error("[signUpAction] Role assignment failed:", roleError.message);
      }

      await AuditService.log({
        actorId: data.user.id,
        actorRole: "guardian",
        action: "GUARDIAN_SIGN_UP_COMPLETED",
        resourceType: "guardian_profiles",
        resourceId: data.user.id,
        metadata: { fullName, email, state },
        ipAddress,
      });

      revalidatePath("/", "layout");
      return { success: true, redirectUrl: "/dashboard" };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Registration service error.",
    };
  }

  return {
    success: false,
    error: "Registration could not be completed. Please try again.",
  };
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for") || headerStore.get("x-real-ip");

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Continue
  }

  if (process.env.NODE_ENV === "development") {
    cookieStore.delete("dev_auth_session");
  }

  await AuditService.log({
    actorRole: "user",
    action: "USER_SIGN_OUT",
    resourceType: "auth.sessions",
    ipAddress,
  });

  revalidatePath("/", "layout");
  redirect("/signin");
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const parsed = resetPasswordRequestSchema.safeParse({ email });

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      error: "Please enter a valid email address.",
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback?next=/update-password`,
    });
  } catch (err: any) {
    console.error("[resetPasswordAction] Reset password email error:", err?.message);
  }

  await AuditService.log({
    actorRole: "anonymous",
    action: "PASSWORD_RESET_REQUESTED",
    resourceType: "auth.users",
    metadata: { email: parsed.data.email },
  });

  return {
    success: true,
  };
}

export async function devSwitchUserRole(role: "admin" | "guardian"): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Unauthorized: Dev operations are strictly prohibited outside development environment."
    );
  }

  const cookieStore = await cookies();

  if (role === "admin") {
    const adminId = process.env.DEV_ADMIN_ID || "a0000000-0000-0000-0000-000000000001";
    cookieStore.set(
      "dev_auth_session",
      encodeURIComponent(
        JSON.stringify({
          id: adminId,
          email: process.env.DEV_ADMIN_EMAIL || "admin@abcdjnvst.in",
          role: "admin",
          name: "Navodaya Lead Admin",
          state: "Delhi",
        })
      ),
      { path: "/", httpOnly: true, sameSite: "lax" }
    );
  } else {
    const guardianId =
      process.env.DEV_GUARDIAN_ID || "g0000000-0000-0000-0000-000000000001";
    cookieStore.set(
      "dev_auth_session",
      encodeURIComponent(
        JSON.stringify({
          id: guardianId,
          email: process.env.DEV_GUARDIAN_EMAIL || "guardian@example.com",
          role: "guardian",
          name: "Ramesh Sharma",
          state: "Rajasthan",
        })
      ),
      { path: "/", httpOnly: true, sameSite: "lax" }
    );
  }
}
