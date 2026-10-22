import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/integrations/auth";
import { ReservarView } from "./reservar-view";

interface CourtInfo {
  id: string;
  clubId: string;
  name: string;
  sport: string;
  pricePerSlot: number;
  active: boolean;
}

interface ClubInfo {
  id: string;
  slug: string;
  name: string;
  city: string;
  barrio: string | null;
}

async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

interface ReservarPageProps {
  searchParams: Promise<{ cancha?: string; inicio?: string }>;
}

function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-ground px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-muted" aria-hidden="true" />
      <h1 className="text-xl font-extrabold">{title}</h1>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      <Link
        href="/buscar"
        className="inline-flex min-h-11 items-center rounded-xl bg-bordo px-5 text-sm font-bold text-white no-underline"
      >
        Volver a buscar
      </Link>
    </main>
  );
}

export default async function ReservarPage({ searchParams }: ReservarPageProps) {
  const sp = await searchParams;
  const courtId = sp.cancha;
  const startsAt = sp.inicio;

  if (!courtId || !startsAt) {
    return (
      <ErrorScreen
        title="Falta información del turno"
        message="No encontramos la cancha o el horario que querés reservar. Elegí un turno desde la página del club."
      />
    );
  }

  const parsedDate = new Date(startsAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return (
      <ErrorScreen
        title="Horario inválido"
        message="El horario del turno no es válido. Elegí un turno nuevamente."
      />
    );
  }

  const origin = await getOrigin();
  const h = await headers();

  let court: CourtInfo | null = null;
  let club: ClubInfo | null = null;
  let errorMessage: string | null = null;
  let notFound = false;

  try {
    const res = await fetch(`${origin}/api/courts/${encodeURIComponent(courtId)}`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      notFound = true;
    } else if (!res.ok) {
      errorMessage = "No pudimos cargar los datos de la cancha. Probá de nuevo en un momento.";
    } else {
      const data = (await res.json()) as { court: CourtInfo; club: ClubInfo };
      court = data.court;
      club = data.club;
    }
  } catch {
    errorMessage = "No pudimos conectarnos al servidor. Revisá tu conexión e intentá de nuevo.";
  }

  if (notFound) {
    return (
      <ErrorScreen
        title="No encontramos esa cancha"
        message="La cancha que intentás reservar no existe o fue eliminada."
      />
    );
  }

  if (errorMessage || !court || !club) {
    return (
      <ErrorScreen
        title="Ocurrió un error"
        message={errorMessage ?? "No pudimos cargar los datos del turno."}
      />
    );
  }

  const session = await auth.api.getSession({ headers: h });
  const isLoggedIn = Boolean(session);

  const currentUrl = `${origin}/reservar?cancha=${encodeURIComponent(courtId)}&inicio=${encodeURIComponent(startsAt)}`;

  return (
    <ReservarView
      court={court}
      club={club}
      startsAt={startsAt}
      isLoggedIn={isLoggedIn}
      currentUrl={currentUrl}
    />
  );
}
