import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PanelReservasPage from "@/app/panel/reservas/page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const row = {
  booking: {
    id: "booking-1",
    courtId: "court-1",
    startsAt: "2026-10-26T00:00:00.000Z",
    endsAt: "2026-10-26T01:00:00.000Z",
    price: 30000,
    status: "confirmed" as const,
  },
  courtName: "Cancha 1",
  playerName: "Jugador Uno",
};

describe("PanelReservasPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockClear();
  });

  it("muestra las filas del historial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.startsWith("/api/panel/courts")) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [row] } as Response);
      }),
    );

    render(<PanelReservasPage />);

    expect(await screen.findByText("Jugador Uno")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 reservas")).toBeInTheDocument();
  });

  it("muestra el estado vacio cuando no hay resultados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [] } as Response)),
    );
    render(<PanelReservasPage />);
    expect(
      await screen.findByText("No se encontraron reservas con estos filtros."),
    ).toBeInTheDocument();
  });

  it("tocar un filtro de estado actualiza la URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [] } as Response)),
    );
    render(<PanelReservasPage />);
    await screen.findByText("No se encontraron reservas con estos filtros.");

    fireEvent.click(screen.getByRole("button", { name: "Confirmadas" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/panel/reservas?estado=confirmed");
    });
  });
});
