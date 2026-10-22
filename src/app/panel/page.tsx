"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingRow {
  booking: {
    id: string;
    courtId: string;
    userId: string;
    startsAt: string;
    endsAt: string;
    price: number;
    status: "confirmed" | "cancelled_by_player" | "cancelled_by_club";
    cancelledAt: string | null;
  };
  courtName: string;
  playerName: string;
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatMoney(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const WEEKDAY_LONG = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const MONTH_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function PanelHoyPage() {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const desde = `${date}T00:00:00`;
        const hasta = `${date}T23:59:59`;
        const res = await fetch(
          `/api/panel/bookings?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
        );
        if (!res.ok) throw new Error("No se pudieron cargar las reservas de hoy");
        const data: BookingRow[] = await res.json();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error inesperado");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const confirmedRows = useMemo(
    () => (rows ?? []).filter((r) => r.booking.status === "confirmed"),
    [rows],
  );

  const stats = useMemo(() => {
    const totalAmount = confirmedRows.reduce((sum, r) => sum + r.booking.price, 0);
    const courtsUsed = new Set(confirmedRows.map((r) => r.booking.courtId)).size;
    return {
      count: confirmedRows.length,
      totalAmount,
      courtsUsed,
    };
  }, [confirmedRows]);

  const sortedRows = useMemo(
    () =>
      [...confirmedRows].sort(
        (a, b) => new Date(a.booking.startsAt).getTime() - new Date(b.booking.startsAt).getTime(),
      ),
    [confirmedRows],
  );

  const dateObj = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const title = `${WEEKDAY_LONG[dateObj.getDay()]} ${dateObj.getDate()} de ${MONTH_LONG[dateObj.getMonth()]}`;

  const shiftDate = (deltaDays: number) => {
    const next = new Date(dateObj);
    next.setDate(next.getDate() + deltaDays);
    setDate(toDateInputValue(next));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="m-0 mb-1 text-sm text-muted">{title}</p>
          <h1 className="m-0 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Hoy
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-label="Día anterior"
            onClick={() => shiftDate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Fecha</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-h-11 rounded-xl border border-line bg-white px-3 text-[15px] font-semibold text-ink"
            />
          </label>
          <button
            type="button"
            aria-label="Día siguiente"
            onClick={() => shiftDate(1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-ink"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
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

      {!loading && !error && (
        <>
          <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="m-0 text-sm text-muted">Reservas del día</p>
              <p className="m-0 mt-1.5 text-[34px] font-extrabold tabular-nums">
                {stats.count}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="m-0 text-sm text-muted">Monto reservado</p>
              <p className="m-0 mt-1.5 text-[34px] font-extrabold tabular-nums">
                {formatMoney(stats.totalAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="m-0 text-sm text-muted">Canchas con reservas</p>
              <p className="m-0 mt-1.5 text-[34px] font-extrabold tabular-nums">
                {stats.courtsUsed}
              </p>
            </div>
          </div>

          <section
            aria-labelledby="prox"
            className="rounded-3xl border border-line bg-white p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="prox" className="m-0 text-xl font-extrabold">
                Reservas de hoy
              </h2>
              <Link
                href="/panel/reservas"
                className="flex min-h-11 items-center text-sm font-bold text-bordo"
              >
                Ver historial
              </Link>
            </div>

            {sortedRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
                No hay reservas para este día.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[15px]">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                        Horario
                      </th>
                      <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                        Cancha
                      </th>
                      <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                        Cliente
                      </th>
                      <th
                        scope="col"
                        className="border-b border-line px-3 py-2.5 text-right font-bold"
                      >
                        Monto
                      </th>
                      <th scope="col" className="border-b border-line px-3 py-2.5 font-bold">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r) => (
                      <tr key={r.booking.id}>
                        <td className="border-b border-[#F1EEEE] px-3 py-3 font-bold tabular-nums">
                          {formatTime(r.booking.startsAt)} – {formatTime(r.booking.endsAt)}
                        </td>
                        <td className="border-b border-[#F1EEEE] px-3 py-3">{r.courtName}</td>
                        <td className="border-b border-[#F1EEEE] px-3 py-3">{r.playerName}</td>
                        <td className="border-b border-[#F1EEEE] px-3 py-3 text-right tabular-nums">
                          {formatMoney(r.booking.price)}
                        </td>
                        <td className="border-b border-[#F1EEEE] px-3 py-3">
                          <Badge tone="ok">Confirmada</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
