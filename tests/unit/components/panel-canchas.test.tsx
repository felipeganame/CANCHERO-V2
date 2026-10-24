import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

function getNewCourtPriceInput() {
  const matches = screen.getAllByLabelText("Precio por turno", { exact: false });
  return matches[matches.length - 1]!;
}
import PanelCanchasPage from "@/app/panel/canchas/page";

const courts = [
  {
    id: "court-1",
    clubId: "club-1",
    name: "Cancha 1",
    sport: "futbol5" as const,
    pricePerSlot: 30000,
    active: true,
  },
];

function mockFetchResponses() {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";

      if (url === "/api/panel/courts" && method === "GET") {
        return Promise.resolve({ ok: true, json: async () => courts } as Response);
      }
      if (url.startsWith("/api/panel/bookings")) {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      if (url === "/api/panel/courts" && method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...courts[0], id: "court-2" }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    }),
  );
}

describe("PanelCanchasPage", () => {
  beforeEach(() => {
    mockFetchResponses();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("carga y muestra las canchas del club", async () => {
    render(<PanelCanchasPage />);
    expect(await screen.findByText("Cancha 1")).toBeInTheDocument();
    expect(screen.getByText("Habilitada")).toBeInTheDocument();
  });

  it("CP-130 [RN-06] rechaza crear una cancha con precio 0", async () => {
    render(<PanelCanchasPage />);
    await screen.findByText("Cancha 1");

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Cancha Nueva" },
    });
    fireEvent.change(getNewCourtPriceInput(), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cancha/i }));

    expect(
      await screen.findByText(/mayor a \$ 0 y menor a \$ 200\.000/i),
    ).toBeInTheDocument();
  });

  it("CP-131 [RN-06] rechaza crear una cancha sin nombre", async () => {
    render(<PanelCanchasPage />);
    await screen.findByText("Cancha 1");

    fireEvent.change(getNewCourtPriceInput(), { target: { value: "15000" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar cancha/i }));

    expect(
      await screen.findByText(/Ingresá un nombre/i),
    ).toBeInTheDocument();
  });

  it("deshabilitar una cancha pide confirmacion antes de PATCHear", async () => {
    render(<PanelCanchasPage />);
    await screen.findByText("Cancha 1");

    fireEvent.click(screen.getByRole("button", { name: /Deshabilitar/i }));

    expect(
      await screen.findByText(/¿Deshabilitar Cancha 1\?/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Deshabilitar y cancelar reservas/i }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/panel/courts/court-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ active: false }),
        }),
      );
    });
  });
});
