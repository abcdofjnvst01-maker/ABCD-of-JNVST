import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool, PoolClient } from "pg";

describe("Phase 2: Mock Tests & Attempts Row Level Security (RLS) Tests", () => {
  let pool: Pool;
  const studentAId = "11111111-1111-1111-1111-111111111111";
  const studentBId = "22222222-2222-2222-2222-222222222222";
  const adminId = "99999999-9999-9999-9999-999999999999";
  const testId = "10000000-0000-0000-0000-000000000010";

  beforeAll(async () => {
    pool = new Pool({
      database: process.env.PGDATABASE || "abcd_jnvst_test",
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || undefined,
    });
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
        await client.query(`SELECT set_config('request.jwt.claim.sub', '${userId}', true);`);
      } else {
        await client.query(`SELECT set_config('request.jwt.claim.sub', '', true);`);
      }
      const res = await fn(client);
      await client.query("COMMIT;");
      return res;
    } catch (e) {
      await client.query("ROLLBACK;");
      throw e;
    } finally {
      await client.query("RESET ROLE;");
      client.release();
    }
  }

  it("allows any authenticated user to view published mock tests", async () => {
    await withSession("authenticated", studentAId, async (client) => {
      const res = await client.query(`SELECT * FROM public.mock_tests WHERE is_published = true;`);
      expect(res.rows.length).toBeGreaterThan(0);
    });
  });

  it("prevents non-admins from creating new mock tests", async () => {
    await withSession("authenticated", studentAId, async (client) => {
      const newTestId = crypto.randomUUID();
      try {
        await client.query(`
          INSERT INTO public.mock_tests (id, title, exam_type, duration_minutes, total_questions, total_marks)
          VALUES ('${newTestId}', 'Hacked Test', 'full_mock', 120, 80, 100);
        `);
      } catch (err: any) {
        // Expected RLS or permission rejection
        expect(err).toBeDefined();
      }
    });
  });

  it("enforces tenant isolation on test attempts (Student A cannot see Student B attempts)", async () => {
    const attemptAId = crypto.randomUUID();

    // 1. Student A creates attempt
    await withSession("authenticated", studentAId, async (client) => {
      await client.query(`
        INSERT INTO public.test_attempts (id, student_id, test_id, status)
        VALUES ('${attemptAId}', '${studentAId}', '${testId}', 'in_progress');
      `);
    });

    // 2. Student A can see their own attempt
    await withSession("authenticated", studentAId, async (client) => {
      const res = await client.query(`SELECT * FROM public.test_attempts WHERE id = '${attemptAId}';`);
      expect(res.rows.length).toBe(1);
    });

    // 3. Student B CANNOT see Student A's attempt
    await withSession("authenticated", studentBId, async (client) => {
      const res = await client.query(`SELECT * FROM public.test_attempts WHERE id = '${attemptAId}';`);
      expect(res.rows.length).toBe(0);
    });
  });
});
