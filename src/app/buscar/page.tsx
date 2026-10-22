import { headers } from "next/headers";
import type { ClubWithCourts } from "@/server/repositories/types";
import { BuscarResults } from "./buscar-results";

const SPORT_LABELS: Record<string, string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  padel: "Pádel",
  tenis: "Tenis",
};

function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

interface SearchPageProps {
  searchParams: Promise<{
    deporte?: string;
    ciudad?: string;
    fecha?: string;
  }>;
}

export default async function BuscarPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const deporte = params.deporte ?? "futbol5";
  const ciudad = params.ciudad ?? "Córdoba";
  const fecha = params.fecha ?? todayLocalDate();

  const origin = await getOrigin();
  const url = `${origin}/api/search?deporte=${encodeURIComponent(deporte)}&ciudad=${encodeURIComponent(ciudad)}&fecha=${encodeURIComponent(fecha)}`;

  let clubs: ClubWithCourts[] = [];
  let errorMessage: string | null = null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      errorMessage = "No pudimos cargar los resultados. Probá de nuevo en un momento.";
    } else {
      clubs = (await res.json()) as ClubWithCourts[];
    }
  } catch {
    errorMessage = "No pudimos conectarnos al servidor. Revisá tu conexión e intentá de nuevo.";
  }

  const sportLabel = SPORT_LABELS[deporte] ?? deporte;

  return (
    <BuscarResults
      clubs={clubs}
      errorMessage={errorMessage}
      deporte={deporte}
      ciudad={ciudad}
      fecha={fecha}
      sportLabel={sportLabel}
    />
  );
}
