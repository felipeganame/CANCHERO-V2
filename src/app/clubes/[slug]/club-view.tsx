"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { SlotChip } from "@/components/ui/slot-chip";
import { formatSlotHour, formatPriceARS, formatLocalDateLong } from "@/lib/format";

interface SlotInfo {
  startsAt: string;
  free: boolean;
}

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
  lat: number;
  lng: number;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
}

export interface GridRow {
  court: CourtInfo;
  slots: SlotInfo[];
}

const SPORT_LABELS: Record<string, string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  padel: "Pádel",
  tenis: "Tenis",
};

export function ClubView({
  club,
  grid,
  fecha,
}: {
  club: ClubInfo;
  grid: GridRow[];
  fecha: string;
}) {
  const sportSet = Array.from(
    new Set(grid.map((row) => row.court.sport)),
  );
  const dateLabel = formatLocalDateLong(fecha);

  return (
    <main className="bg-ground pb-24 md:pb-10">
      <nav aria-label="Ruta" className="px-4 pt-4 text-sm text-muted sm:px-8">
        <Link href="/buscar" className="text-muted no-underline hover:underline">
          Resultados
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{club.name}</span>
      </nav>

      <div className="mx-auto max-w-[1340px] px-4 pb-8 pt-4 sm:px-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {sportSet.map((s) => (
            <span
              key={s}
              className="rounded-full bg-bordo-soft px-3 py-1.5 text-xs font-bold text-bordo"
            >
              {SPORT_LABELS[s] ?? s}
            </span>
          ))}
          <span className="rounded-full bg-bordo-soft px-3 py-1.5 text-xs font-bold text-bordo">
            {grid.length} {grid.length === 1 ? "cancha" : "canchas"}
          </span>
        </div>

        <h1 className="text-[clamp(28px,4vw,48px)] font-extrabold leading-none tracking-tight">
          {club.name}
        </h1>
        <p className="mt-3 flex items-center gap-1.5 text-base text-muted">
          <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
          {club.barrio ? `${club.barrio}, ` : ""}
          {club.city}
        </p>

        <div className="mt-7 flex flex-wrap items-start gap-6">
          <section
            aria-labelledby="turnos"
            className="min-w-0 flex-[999_1_560px] rounded-3xl border border-line bg-white p-5 sm:p-6"
          >
            <h2
              id="turnos"
              className="mb-1 text-xl font-extrabold tracking-tight"
            >
              Elegí horario
            </h2>
            <p className="mb-4 text-sm text-muted">{dateLabel}</p>

            <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border-[1.5px] border-bordo" />
                Libre
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded bg-busy-soft" />
                Ocupado
              </span>
            </div>

            {grid.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Este club no tiene canchas activas.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {grid.map((row) => (
                  <div key={row.court.id}>
                    <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-base font-bold">{row.court.name}</h3>
                      <span className="text-sm text-muted tabular-nums">
                        {formatPriceARS(row.court.pricePerSlot)} / turno
                      </span>
                    </div>
                    {row.slots.length === 0 ? (
                      <p className="text-sm text-muted">
                        Sin horarios este día.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                        {row.slots.map((slot) => {
                          const time = formatSlotHour(slot.startsAt);
                          if (!slot.free) {
                            return (
                              <SlotChip
                                key={slot.startsAt}
                                time={time}
                                state="busy"
                              />
                            );
                          }
                          return (
                            <Link
                              key={slot.startsAt}
                              href={`/reservar?cancha=${row.court.id}&inicio=${encodeURIComponent(slot.startsAt)}`}
                              className="flex min-h-11 min-w-16 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-semibold tabular-nums text-ink no-underline transition-colors hover:border-bordo"
                            >
                              {time}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="min-w-0 flex-[1_1_320px] rounded-3xl border border-line bg-white p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              Ubicación
            </p>
            <p className="text-base font-semibold">
              {club.barrio ? `${club.barrio}, ` : ""}
              {club.city}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Tocá un horario libre para ir a confirmar tu reserva.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
