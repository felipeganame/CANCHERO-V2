"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface BookingRow {
  booking: {
    id: string;
    courtId: string;
    startsAt: string;
    endsAt: string;
    price: number;
    status: "confirmed" | "cancelled_by_player" | "cancelled_by_club";
  };
  courtName: string;
  playerName: string;
}

interface Court {
  id: string;
  name: string;
}

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "cancelled_by_player", label: "Canceladas (jugador)" },
  { id: "cancelled_by_club", label: "Canceladas (club)" },
];

function formatMoney(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

function statusBadge(status: BookingRow["booking"]["status"]) {
  if (status === "confirmed") return { tone: "ok" as const, label: "Confirmada" };
  if (status === "cancelled_by_club") return { tone: "danger" as const, label: "Cancelada (club)" };
  return { tone: "danger" as const, label: "Cancelada (jugador)" };
}

export default function PanelReservasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";
  const cancha = searchParams.get("cancha") ?? "";
  const estado = searchParams.get("estado") ?? "all";
  const q = searchParams.get("q") ?? "";

  const [courts, setCourts] = useState<Court[]>([]);
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    void fetch("/api/panel/courts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Court[]) => setCourts(data))
      .catch(() => setCourts([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (desde) params.set("desde", desde);
        if (hasta) params.set("hasta", hasta);
        if (cancha) params.set("cancha", cancha);
        if (estado && estado !== "all") params.set("estado", estado);
        if (q) params.set("q", q);

        const res = await fetch(`/api/panel/bookings?${params.toString()}`);
        if (!res.ok) throw new Error("No se pudo cargar el historial");
        const data: BookingRow[] = await res.json();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [desde, hasta, cancha, estado, q]);

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/panel/reservas?${next.toString()}`);
  };

  const sortedRows = useMemo(
    () =>
      [...(rows ?? [])].sort(
        (a, b) => new Date(b.booking.startsAt).getTime() - new Date(a.booking.startsAt).getTime(),
      ),
    [rows],
  );

  return (
    <div>
      <h1 className="m-0 mb-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Reservas
      </h1>

      <form
        aria-label="Filtros"
        onSubmit={(e) => e.preventDefault()}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-[20px] border border-line bg-white p-4"
      >
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => updateParams({ desde: e.target.value })}
            className="min-h-11 rounded-xl border border-line px-3 text-[15px] text-ink"
          />
        </label>
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => updateParams({ hasta: e.target.value })}
            className="min-h-11 rounded-xl border border-line px-3 text-[15px] text-ink"
          />
        </label>
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">Cancha</span>
          <select
            value={cancha}
            onChange={(e) => updateParams({ cancha: e.target.value })}
            className="min-h-11 rounded-xl border border-line bg-white px-2.5 text-[15px] text-ink"
          >
            <option value="">Todas</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-[2] basis-[220px] flex-col gap-1.5">
          <span className="text-xs font-bold text-muted">Cliente</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => updateParams({ q: searchInput })}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ q: searchInput });
            }}
            placeholder="Buscar por nombre"
            className="min-h-11 rounded-xl border border-line px-3 text-[15px] text-ink"
          />
        </label>
      </form>

      <div role="group" aria-label="Estado" className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => {
          const pressed = estado === s.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={pressed}
              onClick={() => updateParams({ estado: s.id === "all" ? "" : s.id })}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                pressed
                  ? "border-0 bg-ink text-white"
                  : "border border-line bg-white text-ink"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <section
        aria-label="Resultados"
        className="rounded-3xl border border-line bg-white p-2 pb-4"
      >
        {loading && (
          <div className="p-8 text-center text-muted">Cargando reservas…</div>
        )}
        {!loading && error && (
          <div className="p-8 text-center text-danger">{error}</div>
        )}
        {!loading && !error && sortedRows.length === 0 && (
          <div className="p-10 text-center text-muted">
            No se encontraron reservas con estos filtros.
          </div>
        )}
        {!loading && !error && sortedRows.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th scope="col" className="border-b border-line p-3.5 font-bold">
                      Fecha
                    </th>
                    <th scope="col" className="border-b border-line p-3.5 font-bold">
                      Horario
                    </th>
                    <th scope="col" className="border-b border-line p-3.5 font-bold">
                      Cancha
                    </th>
                    <th scope="col" className="border-b border-line p-3.5 font-bold">
                      Cliente
                    </th>
                    <th
                      scope="col"
                      className="border-b border-line p-3.5 text-right font-bold"
                    >
                      Monto
                    </th>
                    <th scope="col" className="border-b border-line p-3.5 font-bold">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => {
                    const badge = statusBadge(r.booking.status);
                    return (
                      <tr key={r.booking.id}>
                        <td className="border-b border-[#F1EEEE] p-3.5 font-bold tabular-nums">
                          {formatDate(r.booking.startsAt)}
                        </td>
                        <td className="border-b border-[#F1EEEE] p-3.5 tabular-nums">
                          {formatTimeRange(r.booking.startsAt, r.booking.endsAt)}
                        </td>
                        <td className="border-b border-[#F1EEEE] p-3.5">{r.courtName}</td>
                        <td className="border-b border-[#F1EEEE] p-3.5">{r.playerName}</td>
                        <td className="border-b border-[#F1EEEE] p-3.5 text-right tabular-nums">
                          {formatMoney(r.booking.price)}
                        </td>
                        <td className="border-b border-[#F1EEEE] p-3.5">
                          <Badge tone={badge.tone}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 pt-3.5">
              <p className="m-0 text-sm text-muted">
                Mostrando {sortedRows.length} reservas
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
