"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

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

const SPORT_LABELS: Record<string, string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  padel: "Pádel",
  tenis: "Tenis",
};

function formatPrice(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatDateTime(iso: string): { day: string; range: string } {
  const start = new Date(iso);
  const startLocal = new Date(start.getTime() + -3 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const endLocal = new Date(end.getTime() + -3 * 60 * 60 * 1000);

  const day = startLocal.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });
  const startH = `${String(startLocal.getUTCHours()).padStart(2, "0")}:${String(startLocal.getUTCMinutes()).padStart(2, "0")}`;
  const endH = `${String(endLocal.getUTCHours()).padStart(2, "0")}:${String(endLocal.getUTCMinutes()).padStart(2, "0")}`;
  return { day, range: `${startH} – ${endH}` };
}

type Step = "login" | "confirm" | "done" | "taken";

export function ReservarView({
  court,
  club,
  startsAt,
  isLoggedIn,
  currentUrl,
}: {
  court: CourtInfo;
  club: ClubInfo;
  startsAt: string;
  isLoggedIn: boolean;
  currentUrl: string;
}) {
  const [step, setStep] = useState<Step>(isLoggedIn ? "confirm" : "login");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { day, range } = formatDateTime(startsAt);
  const sportLabel = SPORT_LABELS[court.sport] ?? court.sport;

  async function handleGoogleLogin() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: currentUrl,
    });
  }

  async function handleConfirm() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courtId: court.id, startsAt }),
      });

      if (res.status === 201) {
        setStep("done");
        return;
      }

      if (res.status === 401) {
        setStep("login");
        return;
      }

      if (res.status === 409) {
        setStep("taken");
        return;
      }

      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(body?.error ?? "No pudimos confirmar la reserva. Probá de nuevo.");
    } catch {
      setErrorMessage("No pudimos conectarnos al servidor. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { n: 1, label: "Ingresar" },
    { n: 2, label: "Confirmar" },
    { n: 3, label: "Listo" },
  ];
  const stepIdx = step === "login" ? 0 : step === "confirm" ? 1 : 2;

  return (
    <main className="bg-ground pb-16">
      <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-8 sm:px-8">
        <Link
          href={`/clubes/${club.slug}`}
          className="mb-7 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink no-underline"
        >
          <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
          Volver al club
        </Link>

        <ol aria-label="Pasos" className="mb-9 flex flex-wrap gap-2">
          {steps.map((s, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <li
                key={s.label}
                className={[
                  "flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold",
                  active
                    ? "bg-ink text-white"
                    : done
                      ? "bg-ok-soft text-ok"
                      : "border border-line bg-white text-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-extrabold",
                    active
                      ? "bg-naranja text-[#2A0D13]"
                      : done
                        ? "bg-ok text-white"
                        : "bg-busy-soft text-muted",
                  ].join(" ")}
                >
                  {done ? "✓" : s.n}
                </span>
                {s.label}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-start gap-7">
          <section className="min-w-0 flex-[999_1_520px] rounded-[28px] border border-line bg-white p-6 sm:p-11">
            {step === "login" && (
              <div>
                <h1 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.05] tracking-tight">
                  Ingresá para reservar
                </h1>
                <p className="mt-3.5 max-w-md text-base leading-relaxed text-muted">
                  Usamos tu cuenta de Google para identificarte. No tenés que
                  crear usuario ni contraseña.
                </p>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-7 flex min-h-14 w-full max-w-[420px] items-center justify-center gap-3 rounded-2xl border-[1.5px] border-[#CFC6C8] bg-white font-bold text-ink"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                  </svg>
                  Continuar con Google
                </button>
                <Link
                  href={`/login?next=${encodeURIComponent(currentUrl)}`}
                  className="mt-4 inline-block text-sm font-semibold text-bordo no-underline hover:underline"
                >
                  Otras formas de entrar
                </Link>
              </div>
            )}

            {step === "confirm" && (
              <div>
                <h1 className="text-[clamp(28px,3.4vw,40px)] font-extrabold leading-[1.05] tracking-tight">
                  Revisá y confirmá
                </h1>

                <ul className="my-7 flex flex-col gap-3 text-base leading-relaxed text-[#3E3638]">
                  <li className="flex gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 flex-none text-ok"
                      aria-hidden="true"
                    />
                    El turno queda a tu nombre apenas confirmás.
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 flex-none text-ok"
                      aria-hidden="true"
                    />
                    Lo pagás en el complejo.
                  </li>
                  <li className="flex gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 flex-none text-ok"
                      aria-hidden="true"
                    />
                    Si no podés ir, la cancelás desde Mis reservas.
                  </li>
                </ul>

                {errorMessage && (
                  <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
                    {errorMessage}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="confirm"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-[1_1_240px]"
                  >
                    {submitting ? "Confirmando..." : "Confirmar reserva"}
                  </Button>
                  <Link
                    href={`/clubes/${club.slug}`}
                    className="inline-flex min-h-14 flex-[0_1_auto] items-center justify-center rounded-2xl border-[1.5px] border-line px-6 text-base font-bold text-ink no-underline"
                  >
                    Cambiar horario
                  </Link>
                </div>
              </div>
            )}

            {step === "done" && (
              <div>
                <span
                  aria-hidden="true"
                  className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-ok-soft"
                >
                  <CheckCircle2 className="h-9 w-9 text-ok" />
                </span>
                <h1 className="mt-5 text-[clamp(28px,3.4vw,42px)] font-extrabold leading-[1.05] tracking-tight">
                  ¡Reserva confirmada!
                </h1>
                <p className="mt-3.5 max-w-md text-base leading-relaxed text-muted">
                  Te esperan el {day} a las {range.split(" – ")[0]} en{" "}
                  {club.name}, {court.name}. La vas a encontrar en Mis
                  reservas.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/mis-reservas"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-bordo px-6 text-base font-extrabold text-white no-underline"
                  >
                    Ver mis reservas
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl border-[1.5px] border-line px-6 text-base font-bold text-ink no-underline"
                  >
                    Volver al inicio
                  </Link>
                </div>
              </div>
            )}

            {step === "taken" && (
              <div>
                <span
                  aria-hidden="true"
                  className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-naranja-soft"
                >
                  <AlertTriangle className="h-9 w-9 text-naranja-text" />
                </span>
                <h1 className="mt-5 text-[clamp(24px,3.2vw,38px)] font-extrabold leading-[1.05] tracking-tight">
                  Ese turno se acaba de ocupar
                </h1>
                <p className="mt-3.5 max-w-md text-base leading-relaxed text-muted">
                  Otra persona lo reservó mientras confirmabas. Volvé al club
                  para elegir otro horario disponible.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/clubes/${club.slug}`}
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-bordo px-6 text-base font-extrabold text-white no-underline"
                  >
                    Ver todos los horarios
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="min-w-0 flex-[1_1_300px] rounded-[28px] border border-line bg-white p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              Resumen
            </p>
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">
              {club.name}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted">Día</dt>
              <dd className="m-0 text-right font-bold capitalize">{day}</dd>
              <dt className="text-muted">Horario</dt>
              <dd className="m-0 text-right font-bold tabular-nums">
                {range}
              </dd>
              <dt className="text-muted">Cancha</dt>
              <dd className="m-0 text-right font-bold">
                {court.name} · {sportLabel}
              </dd>
              <dt className="text-muted">Dirección</dt>
              <dd className="m-0 text-right font-bold">
                {club.barrio ? `${club.barrio}, ` : ""}
                {club.city}
              </dd>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-line pt-4">
              <span className="text-sm text-muted">Total</span>
              <span className="text-2xl font-extrabold tabular-nums">
                {formatPrice(court.pricePerSlot)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
