import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MisReservasPage from "@/app/mis-reservas/page";

const booking = {
  id: "booking-1",
  courtId: "court-1",
  userId: "user-1",
  startsAt: "2026-10-26T00:00:00.000Z",
  endsAt: "2026-10-26T01:00:00.000Z",
  price: 30000,
  status: "confirmed" as const,
  cancelledAt: null,
};

function mockFetch(bookings = [booking]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("/api/me/bookings")) {
        return Promise.resolve({ ok: true, json: async () => bookings } as Response);
      }
      if (url.startsWith("/api/courts/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ court: { name: "Cancha 1" }, club: { name: "Club Uno" } }),
        } as Response);
      }
      if (url.includes("/cancel")) {
        return Promise.resolve({ ok: true, json: async () => ({ status: "ok" }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    }),
  );
}

describe("MisReservasPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra las reservas proximas con cancha y club", async () => {
    mockFetch();
    render(<MisReservasPage />);

    await screen.findByText("Club Uno");
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName.toLowerCase() === "p" &&
          (el?.textContent?.includes("Cancha 1") ?? false),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName.toLowerCase() === "p" &&
          (el?.textContent?.includes("$ 30.000") ?? false),
      ),
    ).toBeInTheDocument();
  });

  it("muestra el estado vacio cuando no hay reservas", async () => {
    mockFetch([]);
    render(<MisReservasPage />);
    expect(await screen.findByText("No tenés reservas acá")).toBeInTheDocument();
  });

  it("CP-140 [RN-07] cancela una reserva propia tras confirmar", async () => {
    mockFetch();
    render(<MisReservasPage />);

    await screen.findByText("Club Uno");
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(await screen.findByRole("button", { name: /Sí, cancelar/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bookings/booking-1/cancel",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("muestra un error si la carga de reservas falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) } as Response)),
    );
    render(<MisReservasPage />);
    expect(
      await screen.findByText(/No se pudieron cargar las reservas/i),
    ).toBeInTheDocument();
  });
});
