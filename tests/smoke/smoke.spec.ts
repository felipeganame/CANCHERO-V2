import { test, expect } from "@playwright/test";

test("CP-001 home carga", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Canchero" })).toBeVisible();
});

test("CP-002 /api/health responde ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe("ok");
});
