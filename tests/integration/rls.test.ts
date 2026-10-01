import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool, PoolClient } from "pg";

describe("PostgreSQL Row Level Security (RLS) Integration Tests", () => {
  let pool: Pool;
  const guardianAId = "11111111-1111-1111-1111-111111111111";
  const guardianBId = "22222222-2222-2222-2222-222222222222";
  const adminId = "99999999-9999-9999-9999-999999999999";
  const studentAId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const studentBId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  beforeAll(async () => {
    pool = new Pool({
      database: process.env.PGDATABASE || "abcd_jnvst_test",
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || undefined,
    });

    const client = await pool.connect();
    try {
      await client.query("RESET ROLE;");
      await client.query(`
        -- Clean up existing test records
        DELETE FROM public.student_entitlements;
        DELETE FROM public.guardian_student_links;
        DELETE FROM public.student_profiles;
        DELETE FROM public.guardian_profiles;
        DELETE FROM public.application_roles;
        DELETE FROM public.audit_logs;
        DELETE FROM auth.users;

        -- Insert test auth users
        INSERT INTO auth.users (id, email) VALUES
          ('${guardianAId}', 'guardianA@example.com'),
          ('${guardianBId}', 'guardianB@example.com'),
          ('${adminId}', 'admin@abcdjnvst.in');

        -- Assign application roles
        INSERT INTO public.application_roles (user_id, role) VALUES
          ('${guardianAId}', 'guardian'),
          ('${guardianBId}', 'guardian'),
          ('${adminId}', 'admin');

        -- Insert Guardian profiles
        INSERT INTO public.guardian_profiles (id, full_name, email, state) VALUES
          ('${guardianAId}', 'Guardian A', 'guardianA@example.com', 'Rajasthan'),
          ('${guardianBId}', 'Guardian B', 'guardianB@example.com', 'Haryana');

        -- Insert Student profiles
        INSERT INTO public.student_profiles (id, full_name, date_of_birth, district, state, target_exam_year) VALUES
          ('${studentAId}', 'Student A', '2015-05-10', 'Jaipur', 'Rajasthan', 2027),
          ('${studentBId}', 'Student B', '2015-07-15', 'Gurugram', 'Haryana', 2027);

        -- Link students
        INSERT INTO public.guardian_student_links (guardian_id, student_id, relationship, is_primary) VALUES
          ('${guardianAId}', '${studentAId}', 'parent', true),
          ('${guardianBId}', '${studentBId}', 'parent', true);
      `);
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  async function withSession<T>(
    role: "authenticated" | "anon",
    userId: string | null,
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");
      await client.query(`SET ROLE ${role};`);
      if (userId) {
        await client.query(`SET "request.jwt.claim.sub" = '${userId}';`);
      } else {
        await client.query(`RESET "request.jwt.claim.sub";`);
      }
      const result = await fn(client);
      await client.query("COMMIT;");
      return result;
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      try {
        await client.query("RESET ROLE;");
        await client.query(`RESET "request.jwt.claim.sub";`);
      } catch {
        // Ignored
      }
      client.release();
    }
  }

  it("proves Guardian A cannot read Guardian B’s student", async () => {
    await withSession("authenticated", guardianAId, async (client) => {
      const res = await client.query("SELECT id, full_name FROM student_profiles;");
      expect(res.rows.length).toBe(1);
      expect(res.rows[0].id).toBe(studentAId);
      expect(res.rows[0].full_name).toBe("Student A");

      const attemptDirectRead = await client.query(
        `SELECT id FROM student_profiles WHERE id = '${studentBId}';`
      );
      expect(attemptDirectRead.rows.length).toBe(0);
    });
  });

  it("proves Guardian A cannot update Guardian B’s student", async () => {
    await withSession("authenticated", guardianAId, async (client) => {
      const updateRes = await client.query(
        `UPDATE student_profiles SET full_name = 'Malicious Update' WHERE id = '${studentBId}';`
      );
      expect(updateRes.rowCount).toBe(0);
    });

    // Verify name was not modified (as superuser)
    const checkRes = await pool.query(
      `SELECT full_name FROM student_profiles WHERE id = '${studentBId}';`
    );
    expect(checkRes.rows[0].full_name).toBe("Student B");
  });

  it("proves Anonymous users cannot read private data", async () => {
    await withSession("anon", null, async (client) => {
      const students = await client.query("SELECT * FROM student_profiles;");
      expect(students.rows.length).toBe(0);

      const guardians = await client.query("SELECT * FROM guardian_profiles;");
      expect(guardians.rows.length).toBe(0);

      const auditLogs = await client.query("SELECT * FROM audit_logs;");
      expect(auditLogs.rows.length).toBe(0);
    });
  });

  it("proves a guardian cannot assign themselves the admin role", async () => {
    await withSession("authenticated", guardianAId, async (client) => {
      await expect(
        client.query(
          `INSERT INTO application_roles (user_id, role) VALUES ('${guardianAId}', 'admin');`
        )
      ).rejects.toThrow(/violates row-level security policy/i);
    });
  });

  it("proves an administrator can access permitted administration data", async () => {
    await withSession("authenticated", adminId, async (client) => {
      const students = await client.query("SELECT id, full_name FROM student_profiles;");
      expect(students.rows.length).toBe(2);

      const guardians = await client.query(
        "SELECT id, full_name FROM guardian_profiles;"
      );
      expect(guardians.rows.length).toBe(2);
    });
  });

  it("proves audit logs are append-only for normal users", async () => {
    const logId = crypto.randomUUID();

    await withSession("authenticated", guardianAId, async (client) => {
      // 1. Guardian can insert audit record for themselves
      const insertRes = await client.query(
        `INSERT INTO audit_logs (id, actor_id, actor_role, action, resource_type)
         VALUES ('${logId}', '${guardianAId}', 'guardian', 'STUDENT_PROFILE_CREATED', 'student_profiles');`
      );
      expect(insertRes.rowCount).toBe(1);

      // 2. Guardian cannot read audit logs (only admins can read)
      const readRes = await client.query("SELECT * FROM audit_logs;");
      expect(readRes.rows.length).toBe(0);

      // 3. Guardian cannot update audit logs
      const updateRes = await client.query(
        `UPDATE audit_logs SET action = 'ALTERED' WHERE id = '${logId}';`
      );
      expect(updateRes.rowCount).toBe(0);

      // 4. Guardian cannot delete audit logs
      const deleteRes = await client.query(
        `DELETE FROM audit_logs WHERE id = '${logId}';`
      );
      expect(deleteRes.rowCount).toBe(0);
    });

    // 5. Admin can read the audit log
    await withSession("authenticated", adminId, async (client) => {
      const adminRead = await client.query(
        `SELECT id, action, actor_role FROM audit_logs WHERE id = '${logId}';`
      );
      expect(adminRead.rows.length).toBe(1);
      expect(adminRead.rows[0].action).toBe("STUDENT_PROFILE_CREATED");
      expect(adminRead.rows[0].actor_role).toBe("guardian");
    });
  });
});
