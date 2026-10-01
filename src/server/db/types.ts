export type ApplicationRole = "admin" | "guardian";

export type GuardianRelationship = "parent" | "guardian" | "teacher" | "other";

export type EntitlementStatus = "active" | "expired" | "cancelled" | "pending";

export type Gender = "male" | "female" | "other";

export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface ApplicationRoleRecord {
  id: string;
  user_id: string;
  role: ApplicationRole;
  created_at: string;
}

export interface GuardianProfileRecord {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfileRecord {
  id: string;
  full_name: string;
  date_of_birth: string;
  district: string;
  state: string;
  gender: Gender | null;
  target_exam_year: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface GuardianStudentLinkRecord {
  id: string;
  guardian_id: string;
  student_id: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
  created_at: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  price_inr: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentEntitlementRecord {
  id: string;
  student_id: string;
  plan_id: string;
  status: EntitlementStatus;
  starts_at: string;
  expires_at: string;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      application_roles: {
        Row: ApplicationRoleRecord;
        Insert: Omit<ApplicationRoleRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ApplicationRoleRecord>;
        Relationships: [];
      };
      guardian_profiles: {
        Row: GuardianProfileRecord;
        Insert: Omit<GuardianProfileRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<GuardianProfileRecord>;
        Relationships: [];
      };
      student_profiles: {
        Row: StudentProfileRecord;
        Insert: Omit<StudentProfileRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StudentProfileRecord>;
        Relationships: [];
      };
      guardian_student_links: {
        Row: GuardianStudentLinkRecord;
        Insert: Omit<GuardianStudentLinkRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<GuardianStudentLinkRecord>;
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlanRecord;
        Insert: Omit<SubscriptionPlanRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SubscriptionPlanRecord>;
        Relationships: [];
      };
      student_entitlements: {
        Row: StudentEntitlementRecord;
        Insert: Omit<StudentEntitlementRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StudentEntitlementRecord>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRecord;
        Insert: Omit<AuditLogRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLogRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
