"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SlotChip } from "@/components/ui/slot-chip";
import type { ClubWithCourts } from "@/server/repositories/types";

interface SlotInfo {
  startsAt: string;
  free: boolean;
}

interface ClubAvailability {
  club: ClubWithCourts["club"];
  slots: SlotInfo[];
  minPrice: number;
  maxPrice: number;
  freeCount: number;
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  const localMs = d.getTime() + -3 * 60 * 60 * 1000;
  const local = new Date(localMs);
  const h = local.getUTCHours().toString().padStart(2, "0");
  const m = local.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatPrice(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatDateLabel(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  const date = new Date(Date.UTC(y, m - 1, d));
  const formatted = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return formatted;
}

export function BuscarResults({
  clubs,
  errorMessage,
  deporte,
  ciudad,
  fecha,
  sportLabel,
}: {
  clubs: ClubWithCourts[];
  errorMessage: string | null;
  deporte: string;
  ciudad: string;
  fecha: string;
  sportLabel: string;
}) {
  const [availability, setAvailability] = useState<
    Record<string, ClubAvailability>
  >({});
  const [loadingAvailability, setLoadingAvailability] = useState(
    clubs.length > 0,
  );

  useEffect(() => {
    if (clubs.length === 0) {
      setLoadingAvailability(false);
      return;
    }

    let cancelled = false;
    setLoadingAvailability(true);

    Promise.all(
      clubs.map(async (c) => {
        try {
          const res = await fetch(
            `/api/clubs/${c.club.slug}/availability?fecha=${encodeURIComponent(fecha)}`,
            { cache: "no-store" },
          );
          if (!res.ok) return null;
          const data = (await res.json()) as {
            grid: Array<{ slots: SlotInfo[] }>;
          };
          const allSlots = data.grid.flatMap((g) => g.slots);
          const prices = c.courts.map((court) => court.pricePerSlot);
          const result: ClubAvailability = {
            club: c.club,
            slots: allSlots,
            minPrice: prices.length ? Math.min(...prices) : 0,
            maxPrice: prices.length ? Math.max(...prices) : 0,
            freeCount: allSlots.filter((s) => s.free).length,
          };
          return result;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, ClubAvailability> = {};
      for (const r of results) {
        if (r) map[r.club.slug] = r;
      }
      setAvailability(map);
      setLoadingAvailability(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clubs, fecha]);

  const dateLabel = formatDateLabel(fecha);

  return (
    <main className="bg-ground pb-24 md:pb-0">
      <form
        action="/buscar"
        role="search"
        aria-label="Filtros de búsqueda"
        className="flex flex-wrap items-end gap-2.5 border-b border-line bg-white px-4 py-4 sm:px-8"
      >
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Deporte
          </span>
          <select
            name="deporte"
            defaultValue={deporte}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          >
            <option value="futbol5">Fútbol 5</option>
            <option value="futbol7">Fútbol 7</option>
            <option value="padel">Pádel</option>
            <option value="tenis">Tenis</option>
          </select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Ciudad
          </span>
          <input
            type="text"
            name="ciudad"
            defaultValue={ciudad}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          />
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">
            Fecha
          </span>
          <input
            type="date"
            name="fecha"
            defaultValue={fecha}
            className="min-h-11 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink"
          />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-xl bg-bordo px-5 text-sm font-bold text-white"
        >
          Actualizar
        </button>
      </form>

      <div className="mx-auto flex max-w-[1600px] flex-wrap gap-6 px-4 py-6 sm:px-8">
        <section aria-labelledby="res" className="min-w-0 flex-[999_1_560px]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1
                id="res"
                className="text-2xl font-extrabold tracking-tight"
              >
                {errorMessage
                  ? "No pudimos buscar"
                  : `${clubs.length} ${clubs.length === 1 ? "complejo" : "complejos"} con turnos libres`}
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                {sportLabel} · {ciudad} · {dateLabel}
              </p>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-3xl border border-danger-soft bg-danger-soft p-6 text-danger">
              <p className="font-bold">{errorMessage}</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="rounded-3xl border border-line bg-white p-10 text-center">
              <Search
                className="mx-auto mb-4 h-10 w-10 text-muted"
                aria-hidden="true"
              />
              <p className="text-lg font-bold">
                No encontramos canchas libres
              </p>
              <p className="mt-2 text-sm text-muted">
                Probá otra fecha, otra ciudad o cambiá de deporte.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {clubs.map((c, idx) => {
                const avail = availability[c.club.slug];
                const prices = c.courts.map((court) => court.pricePerSlot);
                const minPrice = avail?.minPrice ?? (prices.length ? Math.min(...prices) : 0);

                return (
                  <Card key={c.club.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bordo text-sm font-extrabold text-white"
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold">{c.club.name}</h2>
                          <p className="mt-1 text-sm text-muted">
                            {c.club.barrio ?? c.club.city} ·{" "}
                            {c.courts.length}{" "}
                            {c.courts.length === 1 ? "cancha" : "canchas"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">desde</p>
                        <p className="text-xl font-extrabold tabular-nums">
                          {formatPrice(minPrice)}{" "}
                          <span className="text-sm font-medium text-muted">
                            / turno
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {loadingAvailability ? (
                        <p className="text-sm text-muted">
                          Cargando horarios...
                        </p>
                      ) : avail && avail.slots.length > 0 ? (
                        avail.slots.slice(0, 6).map((s) => (
                          <SlotChip
                            key={s.startsAt}
                            time={formatHour(s.startsAt)}
                            state={s.free ? "free" : "busy"}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted">
                          Sin horarios disponibles ese día.
                        </p>
                      )}
                      <span className="flex-1" />
                      <Link
                        href={`/clubes/${c.club.slug}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-naranja px-4 text-sm font-extrabold text-[#2A0D13] no-underline"
                      >
                        Ver turnos
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <p className="mt-5 text-sm text-muted">
            ¿No encontrás horario? Probá otra fecha o cambiá de ciudad.
          </p>
        </section>

        <aside
          aria-label="Mapa de complejos"
          className="hidden min-w-0 flex-[1_1_460px] md:block"
        >
          <div className="relative h-[760px] overflow-hidden rounded-3xl border border-line bg-[#ECE6E1]">
            <p className="absolute bottom-0 left-0 m-0 rounded-tr-lg bg-white px-2.5 py-1 text-[11px] text-[#5E5759]">
              [Mapa próximamente]
            </p>
          </div>
        </aside>
      </div>

      {clubs.length > 0 && !errorMessage ? (
        <div className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 md:hidden">
          <p className="text-sm font-semibold text-muted">
            {clubs.length} resultados
          </p>
          <Link
            href={clubs[0] ? `/clubes/${clubs[0].club.slug}` : "/buscar"}
            className="inline-flex min-h-11 items-center rounded-xl bg-naranja px-6 text-sm font-extrabold text-[#2A0D13] no-underline"
          >
            Reservar
          </Link>
        </div>
      ) : null}
    </main>
  );
}
