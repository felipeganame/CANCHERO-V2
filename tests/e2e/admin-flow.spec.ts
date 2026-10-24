import { test, expect } from "@playwright/test";
import { loginAs, E2E_ADMIN_EMAIL } from "./auth";

test("CP-210 flujo club: crear cancha -> verla en el panel -> deshabilitarla", async ({
  page,
}) => {
  await loginAs(page, E2E_ADMIN_EMAIL);

  await page.goto("/panel/canchas");
  await expect(page.getByRole("heading", { name: /Canchas/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("Cancha E2E")).toBeVisible({ timeout: 15000 });

  const courtName = `E2E Temp ${Date.now()}`;
  const newCourtForm = page.getByRole("region", { name: "Agregar cancha" });
  await newCourtForm.getByLabel("Nombre").fill(courtName);
  await newCourtForm.getByLabel("Deporte").selectOption("padel");
  await newCourtForm.getByLabel("Precio por turno").fill("12000");
  await newCourtForm.getByRole("button", { name: /Guardar cancha/i }).click();

  const newCourtHeading = page.getByRole("heading", { name: courtName });
  await expect(newCourtHeading).toBeVisible({ timeout: 10000 });

  await page.goto("/panel");
  await expect(page.getByRole("heading", { name: /Hoy/i }).first()).toBeVisible({
    timeout: 15000,
  });

  await page.goto("/panel/canchas");
  await expect(page.getByRole("heading", { name: courtName })).toBeVisible({
    timeout: 10000,
  });

  const courtRow = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: courtName }) });
  await courtRow.getByRole("button", { name: /Deshabilitar/i }).click();

  await page
    .getByRole("button", { name: /Deshabilitar y cancelar reservas/i })
    .click();

  await expect(
    courtRow.getByRole("button", { name: /Habilitar/i }),
  ).toBeVisible({ timeout: 10000 });
});
