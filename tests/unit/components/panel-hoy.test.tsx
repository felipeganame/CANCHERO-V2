import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PanelHoyPage from "@/app/panel/page";

const row = {
  booking: {
    id: "booking-1",
    courtId: "court-1",
    userId: "user-1",
    startsAt: "2026-10-26T00:00:00.000Z",
    endsAt: "2026-10-26T01:00:00.000Z",
    price: 30000,
    status: "confirmed" as const,
    cancelledAt: null,
  },
  courtName: "Cancha 1",
  playerName: "Jugador Uno",
};

describe("PanelHoyPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra las estadisticas y la tabla de reservas del dia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [row] } as Response)),
    );

    render(<PanelHoyPage />);

    expect(await screen.findByText("Jugador Uno")).toBeInTheDocument();
    expect(screen.getByText("Cancha 1")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Monto" })).toBeInTheDocument();
  });

  it("muestra el estado vacio cuando no hay reservas ese dia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [] } as Response)),
    );
    render(<PanelHoyPage />);
    expect(
      await screen.findByText("No hay reservas para este día."),
    ).toBeInTheDocument();
  });

  it("muestra un error si la carga falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) } as Response)),
    );
    render(<PanelHoyPage />);
    expect(
      await screen.findByText(/No se pudieron cargar las reservas de hoy/i),
    ).toBeInTheDocument();
  });

  it("cambiar de fecha dispara una nueva carga", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => [] } as Response),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<PanelHoyPage />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: "Día siguiente" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
