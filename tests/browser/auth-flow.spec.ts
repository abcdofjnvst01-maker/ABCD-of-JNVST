import { test, expect } from "@playwright/test";

test.describe("ABCD of JNVST - Phase 0 Browser Flows", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("renders public landing page with ₹500 plan details", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ABCD of JNVST/);
    await expect(
      page.getByRole("heading", { name: /Master the JNVST Class 6 Entrance/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("₹500 Preparation Package")).toBeVisible();
    await expect(page.getByText("Mental Ability (MAT)")).toBeVisible();
  });

  test("redirects unauthenticated users trying to access guardian dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*signin.*/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /Welcome Back/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("guardian authenticated portal access and navigation", async ({
    page,
    context,
  }) => {
    test.setTimeout(60000);
    await context.addCookies([
      {
        name: "dev_auth_session",
        value: encodeURIComponent(
          JSON.stringify({
            id: "11111111-1111-1111-1111-111111111111",
            email: "guardianA@example.com",
            role: "guardian",
            name: "Ramesh Sharma",
            state: "Rajasthan",
          })
        ),
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Guardian Portal/i })).toBeVisible({
      timeout: 30000,
    });

    // Navigate to register new student
    await page.click("text=Register New Student");
    await expect(page).toHaveURL(/.*dashboard\/students\/new.*/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /Register Student for JNVST Class 6/i })
    ).toBeVisible({ timeout: 30000 });
  });

  test("admin authenticated console access and stats inspection", async ({
    page,
    context,
  }) => {
    test.setTimeout(60000);
    await context.addCookies([
      {
        name: "dev_auth_session",
        value: encodeURIComponent(
          JSON.stringify({
            id: "99999999-9999-9999-9999-999999999999",
            email: "admin@abcdjnvst.in",
            role: "admin",
            name: "Lead Admin",
            state: "Delhi",
          })
        ),
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Administrator Console/i })
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("500 target student capacity")).toBeVisible();
  });
});
