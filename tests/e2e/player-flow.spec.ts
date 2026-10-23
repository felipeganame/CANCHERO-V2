import { test, expect } from "@playwright/test";
import { loginAs, E2E_PLAYER_EMAIL } from "./auth";

function futureLocalDate(daysFromNow: number): string {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

test("CP-200 flujo jugador: buscar -> elegir turno -> confirmar -> ver en Mis reservas -> cancelar", async ({
  page,
}) => {
  await loginAs(page, E2E_PLAYER_EMAIL);

  const fecha = futureLocalDate(30);
  await page.goto(
    `/buscar?deporte=futbol5&ciudad=${encodeURIComponent("Cordoba E2E")}&fecha=${fecha}`,
  );

  const clubCard = page.getByTestId("club-card-club-e2e");
  await expect(clubCard).toBeVisible({ timeout: 15000 });
  await clubCard.getByRole("link", { name: /Ver turnos/i }).click();

  await expect(page.getByRole("heading", { name: "Club E2E" })).toBeVisible();

  const turnosSection = page.getByRole("region", { name: "Elegí horario" });
  const freeSlot = turnosSection.getByRole("link", { name: /^\d{2}:\d{2}$/ }).first();
  await expect(freeSlot).toBeVisible();
  await freeSlot.click();

  await expect(page).toHaveURL(/\/reservar\?/);
  await page.getByRole("button", { name: /Confirmar reserva/i }).click();

  await expect(page.getByRole("heading", { name: /Reserva confirmada/i })).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole("link", { name: /Ver mis reservas/i }).click();
  await expect(page).toHaveURL(/\/mis-reservas/);

  const bookingCard = page.getByText("Cancha E2E").first();
  await expect(bookingCard).toBeVisible({ timeout: 10000 });

  await page
    .getByRole("button", { name: "Cancelar" })
    .first()
    .click();
  await page.getByRole("button", { name: /Sí, cancelar/i }).click();

  await expect(page.getByText("Cancha E2E")).toHaveCount(0, { timeout: 10000 });
});
