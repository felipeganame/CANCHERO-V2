"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type BookingStatus = "confirmed" | "cancelled_by_player" | "cancelled_by_club";

interface Booking {
  id: string;
  courtId: string;
  userId: string;
  startsAt: string;
  endsAt: string;
  price: number;
  status: BookingStatus;
  cancelledAt: string | null;
}

interface CourtInfo {
  name: string;
  clubName: string;
}

type Tab = "proximas" | "pasadas" | "canceladas";

const TAB_DEFS: { id: Tab; label: string }[] = [
  { id: "proximas", label: "Próximas" },
  { id: "pasadas", label: "Pasadas" },
  { id: "canceladas", label: "Canceladas" },
];

const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatMoney(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function MisReservasPage() {
  const [tab, setTab] = useState<Tab>("proximas");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [courtInfo, setCourtInfo] = useState<Record<string, CourtInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/bookings?estado=${t}`);
      if (!res.ok) throw new Error("No se pudieron cargar las reservas");
      const data: Booking[] = await res.json();
      setBookings(data);

      const missingCourtIds = Array.from(
        new Set(data.map((b) => b.courtId).filter((id) => !courtInfo[id])),
      );
      if (missingCourtIds.length > 0) {
        const results = await Promise.all(
          missingCourtIds.map(async (id) => {
            try {
              const r = await fetch(`/api/courts/${id}`);
              if (!r.ok) return null;
              const json = await r.json();
              return {
                id,
                info: {
                  name: json.court?.name ?? "Cancha",
                  clubName: json.club?.name ?? "Club",
                } as CourtInfo,
              };
            } catch {
              return null;
            }
          }),
        );
        setCourtInfo((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r) next[r.id] = r.info;
          }
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "No se pudo cancelar" }));
        throw new Error(body.error ?? "No se pudo cancelar");
      }
      setCancelTarget(null);
      await load(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar la reserva");
    } finally {
      setCancelling(false);
    }
  };

  const sorted = useMemo(() => {
    if (!bookings) return [];
    const copy = [...bookings];
    copy.sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return tab === "pasadas" ? -diff : diff;
    });
    return copy;
  }, [bookings, tab]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Mis reservas
        </h1>
        <Link href="/buscar">
          <Button variant="primary">
            <Plus size={18} aria-hidden="true" />
            Nueva reserva
          </Button>
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Filtrar reservas"
        className="mb-6 flex w-fit max-w-full flex-wrap gap-1.5 rounded-2xl bg-[#F1EEEE] p-1.5"
      >
        {TAB_DEFS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(t.id)}
              className={`min-h-11 rounded-xl px-4 text-sm font-bold ${
                selected ? "bg-white text-ink shadow-sm" : "bg-transparent text-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-3xl border border-line bg-white p-8 text-center text-muted">
          Cargando reservas…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-3xl border border-danger-soft bg-danger-soft p-8 text-center text-danger">
          {error}
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-white p-12 text-center">
          <p className="m-0 mb-1.5 text-lg font-bold text-ink">No tenés reservas acá</p>
          <p className="m-0 mb-4 text-sm text-muted">
            Cuando reserves una cancha, la vas a ver en esta lista.
          </p>
          <Link href="/buscar" className="font-bold text-bordo">
            Buscar canchas
          </Link>
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="flex flex-col gap-3">
          {sorted.map((b) => {
            const info = courtInfo[b.courtId];
            const start = new Date(b.startsAt);
            const isUpcoming = tab === "proximas";
            const badgeTone =
              b.status === "confirmed"
                ? isUpcoming
                  ? "ok"
                  : "busy"
                : "danger";
            const badgeLabel =
              b.status === "confirmed"
                ? isUpcoming
                  ? "Confirmada"
                  : "Jugada"
                : "Cancelada";
            const note =
              b.status === "cancelled_by_club"
                ? "El club deshabilitó la cancha y canceló este turno."
                : b.status === "cancelled_by_player"
                  ? "La cancelaste vos."
                  : null;

            return (
              <article
                key={b.id}
                className="flex flex-wrap items-center gap-5 rounded-[22px] border border-line bg-white p-4"
              >
                <div
                  className={`flex h-[92px] w-[84px] flex-none flex-col items-center justify-center gap-0.5 rounded-2xl ${
                    isUpcoming ? "bg-bordo text-white" : "bg-[#F1EEEE] text-[#5E5759]"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {DOW[start.getDay()]}
                  </span>
                  <span className="text-3xl font-extrabold tabular-nums leading-none">
                    {start.getDate()}
                  </span>
                  <span className="text-xs font-semibold uppercase">
                    {MONTHS[start.getMonth()]}
                  </span>
                </div>
                <div className="min-w-0 flex-1 basis-[260px]">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h2 className="m-0 text-lg font-bold text-ink">
                      {info?.clubName ?? "Cargando…"}
                    </h2>
                    <Badge tone={badgeTone}>{badgeLabel}</Badge>
                  </div>
                  <p className="m-0 text-sm text-muted tabular-nums">
                    {formatTimeRange(b.startsAt, b.endsAt)} · {info?.name ?? "Cancha"} ·{" "}
                    {formatMoney(b.price)}
                  </p>
                  {note && <p className="m-0 mt-2 text-sm text-danger">{note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isUpcoming && b.status === "confirmed" && (
                    <Button variant="ghost" onClick={() => setCancelTarget(b)}>
                      Cancelar
                    </Button>
                  )}
                  {!isUpcoming && (
                    <Link href="/buscar">
                      <Button variant="ghost">Volver a reservar</Button>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="¿Cancelar esta reserva?"
        description="El turno queda libre para otros jugadores y no se puede deshacer."
        confirmLabel={cancelling ? "Cancelando…" : "Sí, cancelar"}
        variant="danger"
        onConfirm={handleCancel}
      />
    </main>
  );
}
