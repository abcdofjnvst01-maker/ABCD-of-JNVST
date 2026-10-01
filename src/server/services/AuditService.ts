import { createServerSupabaseClient } from "@/server/auth/server";
import type { AuditLogRecord } from "@/server/db/types";

export interface LogAuditParams {
  actorId?: string | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

const SENSITIVE_KEY_PATTERN =
  /(password|token|secret|confirmPassword|accessToken|refreshToken|apiKey|authorization|cookie|creditCard|cvv|panNumber|otp)/i;

export function sanitizeAuditMetadata(
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      sanitized[key] = sanitizeAuditMetadata(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      sanitized[key] = val.map((item) =>
        item !== null && typeof item === "object"
          ? sanitizeAuditMetadata(item as Record<string, unknown>)
          : item
      );
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

export class AuditService {
  static async log(params: LogAuditParams): Promise<void> {
    const sanitizedMetadata = sanitizeAuditMetadata(params.metadata);

    const entry: AuditLogRecord = {
      id: crypto.randomUUID(),
      actor_id: params.actorId || null,
      actor_role: params.actorRole,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      metadata: sanitizedMetadata,
      ip_address: params.ipAddress || null,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await (supabase.from("audit_logs") as any).insert(entry);
      if (error) {
        console.error("[AuditService] Database insert failed:", error.message);
      }
    } catch (err: any) {
      console.error(
        "[AuditService] Unexpected error while recording audit log:",
        err?.message || err
      );
    }
  }

  static async getLogs(limit = 50): Promise<AuditLogRecord[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[AuditService] Error fetching logs:", error.message);
        return [];
      }

      return (data as AuditLogRecord[]) || [];
    } catch (err: any) {
      console.error("[AuditService] getLogs failed:", err?.message || err);
      return [];
    }
  }
}
