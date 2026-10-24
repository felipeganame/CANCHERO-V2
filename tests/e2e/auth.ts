import type { Page } from "@playwright/test";

export const E2E_PASSWORD = "Test1234!";
export const E2E_PLAYER_EMAIL = "e2e-player@canchero.test";
export const E2E_ADMIN_EMAIL = "e2e-admin@canchero.test";

// Usa la API directamente (mas rapido y estable que llenar el form de
// login en cada test E2E). Las cuentas de seed ya tienen emailVerified=true.
export async function loginAs(page: Page, email: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: E2E_PASSWORD },
  });
  if (!response.ok()) {
    throw new Error(`Login de test fallo: ${response.status()} ${await response.text()}`);
  }
}
