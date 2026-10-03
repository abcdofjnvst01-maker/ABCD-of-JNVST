import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool, PoolClient } from "pg";

describe("Question Bank & Passages Row Level Security (RLS) Tests", () => {
  let pool: Pool;
  const guardianId = "11111111-1111-1111-1111-111111111111";
  const adminId = "99999999-9999-9999-9999-999999999999";

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

  it("proves authenticated guardians can read active questions and passages", async () => {
    await withSession("authenticated", guardianId, async (client) => {
      const questions = await client.query(
        "SELECT id, topic, section FROM public.questions;"
      );
      expect(questions.rows.length).toBeGreaterThanOrEqual(1);

      const passages = await client.query("SELECT id, title_en FROM public.passages;");
      expect(passages.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("proves normal guardians cannot create questions (RLS policy rejects)", async () => {
    await withSession("authenticated", guardianId, async (client) => {
      await expect(
        client.query(`
          INSERT INTO public.questions (
            id, section, topic, difficulty, marks, negative_marks,
            question_text_en, options, correct_option
          ) VALUES (
            '30000000-0000-0000-0000-000000000001', 'arithmetic', 'fractions', 'easy', 1.25, 0.0,
            'Test unauthorized question', '[]'::jsonb, 'A'
          );
        `)
      ).rejects.toThrow(/violates row-level security policy/i);
    });
  });

  it("proves administrators can create and manage questions and passages", async () => {
    const testQId = "40000000-0000-0000-0000-000000000001";
    const testPId = "50000000-0000-0000-0000-000000000001";

    await withSession("authenticated", adminId, async (client) => {
      // 1. Admin creates passage
      const pRes = await client.query(`
        INSERT INTO public.passages (id, title_en, content_en, language_code)
        VALUES ('${testPId}', 'Admin Passage', 'Admin passage text...', 'en')
        ON CONFLICT (id) DO NOTHING;
      `);
      expect(pRes.rowCount).toBeGreaterThanOrEqual(0);

      // 2. Admin creates question
      const qRes = await client.query(`
        INSERT INTO public.questions (
          id, passage_id, section, topic, difficulty, marks, negative_marks,
          question_text_en, options, correct_option
        ) VALUES (
          '${testQId}', '${testPId}', 'language', 'reading_comprehension', 'easy', 1.25, 0.0,
          'Admin test question', '[]'::jsonb, 'A'
        ) ON CONFLICT (id) DO NOTHING;
      `);
      expect(qRes.rowCount).toBeGreaterThanOrEqual(0);

      // 3. Admin can update and delete
      const uRes = await client.query(
        `UPDATE public.questions SET topic = 'updated_topic' WHERE id = '${testQId}';`
      );
      expect(uRes.rowCount).toBe(1);

      const dRes = await client.query(
        `DELETE FROM public.questions WHERE id = '${testQId}';`
      );
      expect(dRes.rowCount).toBe(1);

      await client.query(`DELETE FROM public.passages WHERE id = '${testPId}';`);
    });
  });
});
