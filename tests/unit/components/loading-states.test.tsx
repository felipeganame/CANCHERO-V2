import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BuscarLoading from "@/app/buscar/loading";
import LoadingClub from "@/app/clubes/[slug]/loading";
import LoadingReservar from "@/app/reservar/loading";

describe("loading states", () => {
  it("BuscarLoading muestra el texto de carga", () => {
    render(<BuscarLoading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Buscando canchas disponibles/i)).toBeInTheDocument();
  });

  it("LoadingClub muestra el texto de carga", () => {
    render(<LoadingClub />);
    expect(screen.getByText("Cargando club...")).toBeInTheDocument();
  });

  it("LoadingReservar muestra el texto de carga", () => {
    render(<LoadingReservar />);
    expect(screen.getByText("Cargando reserva...")).toBeInTheDocument();
  });
});
