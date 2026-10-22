import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { ClubView, type GridRow } from "./club-view";

interface ClubInfo {
  id: string;
  slug: string;
  name: string;
  city: string;
  barrio: string | null;
  lat: number;
  lng: number;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
}

interface AvailabilityResponse {
  club: ClubInfo;
  grid: GridRow[];
}

function todayLocalDate(): string {
  // Argentina timezone (America/Argentina/Cordoba) is fixed UTC-3, no DST.
  const now = new Date();
  const localMs = now.getTime() + -3 * 60 * 60 * 1000;
  const local = new Date(localMs);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

interface ClubPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string }>;
}

export default async function ClubPage({ params, searchParams }: ClubPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const fecha = sp.fecha ?? todayLocalDate();

  const origin = await getOrigin();
  const url = `${origin}/api/clubs/${encodeURIComponent(slug)}/availability?fecha=${encodeURIComponent(fecha)}`;

  let data: AvailabilityResponse | null = null;
  let notFound = false;
  let errorMessage: string | null = null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.status === 404) {
      notFound = true;
    } else if (!res.ok) {
      errorMessage = "No pudimos cargar este club. Probá de nuevo en un momento.";
    } else {
      data = (await res.json()) as AvailabilityResponse;
    }
  } catch {
    errorMessage = "No pudimos conectarnos al servidor. Revisá tu conexión e intentá de nuevo.";
  }

  if (notFound) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ground px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-muted" aria-hidden="true" />
        <h1 className="text-xl font-extrabold">No encontramos este club</h1>
        <p className="max-w-sm text-sm text-muted">
          El club que buscás no existe o cambió de dirección.
        </p>
        <Link
          href="/buscar"
          className="inline-flex min-h-11 items-center rounded-xl bg-bordo px-5 text-sm font-bold text-white no-underline"
        >
          Volver a buscar
        </Link>
      </main>
    );
  }

  if (errorMessage || !data) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ground px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-danger" aria-hidden="true" />
        <h1 className="text-xl font-extrabold">Ocurrió un error</h1>
        <p className="max-w-sm text-sm text-muted">
          {errorMessage ?? "No pudimos cargar este club."}
        </p>
      </main>
    );
  }

  return <ClubView club={data.club} grid={data.grid} fecha={fecha} />;
}
