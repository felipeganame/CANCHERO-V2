import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/headers", () => ({
  headers: async () =>
    new Map([
      ["host", "localhost:3000"],
      ["x-forwarded-proto", "http"],
    ]),
}));

import BuscarPage from "@/app/buscar/page";

describe("BuscarPage (server)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa valores por defecto y pasa los clubes a BuscarResults", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: async () => [] } as Response)),
    );

    const element = await BuscarPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByText("No encontramos canchas libres")).toBeInTheDocument();
  });

  it("muestra un mensaje de error si la API responde con error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) } as Response)),
    );

    const element = await BuscarPage({
      searchParams: Promise.resolve({ deporte: "padel", ciudad: "Rosario", fecha: "2026-10-26" }),
    });
    render(element);

    expect(
      screen.getAllByText(/No pudimos cargar los resultados/i).length,
    ).toBeGreaterThan(0);
  });

  it("muestra un mensaje de error de red si fetch falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network"))),
    );

    const element = await BuscarPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(
      screen.getAllByText(/No pudimos conectarnos al servidor/i).length,
    ).toBeGreaterThan(0);
  });
});
