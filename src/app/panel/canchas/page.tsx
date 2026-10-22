"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Court {
  id: string;
  clubId: string;
  name: string;
  sport: "futbol5" | "futbol7" | "padel" | "tenis";
  pricePerSlot: number;
  active: boolean;
}

interface BookingRow {
  booking: {
    id: string;
    courtId: string;
    startsAt: string;
    status: "confirmed" | "cancelled_by_player" | "cancelled_by_club";
  };
}

const SPORT_LABELS: Record<Court["sport"], string> = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  padel: "Pádel",
  tenis: "Tenis",
};

export default function PanelCanchasPage() {
  const [courts, setCourts] = useState<Court[] | null>(null);
  const [futureCounts, setFutureCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [disableTarget, setDisableTarget] = useState<Court | null>(null);
  const [disabling, setDisabling] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSport, setNewSport] = useState<Court["sport"]>("futbol5");
  const [newPrice, setNewPrice] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadCourts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/panel/courts");
      if (!res.ok) throw new Error("No se pudieron cargar las canchas");
      const data: Court[] = await res.json();
      setCourts(data);

      const now = new Date();
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (c) => {
          try {
            const r = await fetch(
              `/api/panel/bookings?cancha=${c.id}&estado=confirmed`,
            );
            if (!r.ok) return;
            const rows: BookingRow[] = await r.json();
            counts[c.id] = rows.filter(
              (row) => new Date(row.booking.startsAt) > now,
            ).length;
          } catch {
            // ignore per-court failures
          }
        }),
      );
      setFutureCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourts();
  }, []);

  const handleToggleActive = async (court: Court, active: boolean) => {
    try {
      const res = await fetch(`/api/panel/courts/${court.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la cancha");
      await loadCourts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleDisableConfirm = async () => {
    if (!disableTarget) return;
    setDisabling(true);
    try {
      await handleToggleActive(disableTarget, false);
      setDisableTarget(null);
    } finally {
      setDisabling(false);
    }
  };

  const handlePriceBlur = async (court: Court, value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed === court.pricePerSlot) return;
    try {
      const res = await fetch(`/api/panel/courts/${court.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerSlot: parsed }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar el precio");
      await loadCourts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const price = Number(newPrice);
    if (!newName.trim()) {
      setCreateError("Ingresá un nombre para la cancha.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 200000) {
      setCreateError("El precio tiene que ser mayor a $ 0 y menor a $ 200.000.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/panel/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), sport: newSport, pricePerSlot: price }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "No se pudo crear la cancha" }));
        throw new Error(body.error ?? "No se pudo crear la cancha");
      }
      setNewName("");
      setNewSport("futbol5");
      setNewPrice("");
      await loadCourts();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="m-0 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Canchas
        </h1>
        <p className="m-0 mt-2 text-[15px] text-muted">
          Las canchas habilitadas aparecen en las búsquedas de los jugadores.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label="Listado de canchas"
          className="flex min-w-0 flex-[999] basis-[480px] flex-col gap-3"
        >
          {loading && (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-muted">
              Cargando canchas…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-danger-soft bg-danger-soft p-8 text-center text-danger">
              {error}
            </div>
          )}

          {!loading && !error && courts && courts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center text-muted">
              Todavía no agregaste canchas.
            </div>
          )}

          {!loading &&
            !error &&
            courts?.map((c) => (
              <article
                key={c.id}
                className={`rounded-[20px] border border-line p-5 ${c.active ? "bg-white" : "bg-[#FBFAFA]"}`}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-13 w-13 items-center justify-center rounded-2xl ${
                      c.active ? "bg-bordo-soft text-bordo" : "bg-[#F1EEEE] text-[#8A8285]"
                    }`}
                  >
                    <LayoutGrid size={24} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 text-lg font-bold">{c.name}</h2>
                      <Badge tone={c.active ? "ok" : "busy"}>
                        {c.active ? "Habilitada" : "Deshabilitada"}
                      </Badge>
                    </div>
                    <p className="m-0 mt-1 text-sm text-muted">
                      {SPORT_LABELS[c.sport]} · {futureCounts[c.id] ?? 0} reservas futuras
                    </p>
                  </div>
                  <label className="flex w-[150px] flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted">
                      Precio por turno
                    </span>
                    <span className="flex min-h-11 items-center rounded-xl border border-line bg-white px-3">
                      <span className="mr-1.5 text-muted">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Precio por turno de ${c.name}`}
                        defaultValue={c.pricePerSlot}
                        onBlur={(e) => handlePriceBlur(c, e.target.value)}
                        className="w-full border-0 bg-transparent text-base font-bold tabular-nums text-ink outline-none"
                      />
                    </span>
                  </label>
                  {c.active ? (
                    <Button variant="ghost" onClick={() => setDisableTarget(c)}>
                      Deshabilitar
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => handleToggleActive(c, true)}>
                      Habilitar
                    </Button>
                  )}
                </div>
              </article>
            ))}
        </section>

        <section
          aria-labelledby="nueva"
          className="min-w-0 flex-1 basis-[320px] rounded-3xl border border-line bg-white p-6"
        >
          <h2 id="nueva" className="m-0 mb-1.5 text-xl font-extrabold">
            Agregar cancha
          </h2>
          <p className="m-0 mb-4.5 text-sm text-muted">
            Queda habilitada apenas la guardás.
          </p>
          <form onSubmit={handleCreate} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Nombre</span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Cancha 4"
                className="min-h-12 rounded-xl border border-line px-3.5 text-base text-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Deporte</span>
              <select
                value={newSport}
                onChange={(e) => setNewSport(e.target.value as Court["sport"])}
                className="min-h-12 rounded-xl border border-line bg-white px-3 text-base text-ink"
              >
                <option value="futbol5">Fútbol 5</option>
                <option value="futbol7">Fútbol 7</option>
                <option value="padel">Pádel</option>
                <option value="tenis">Tenis</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Precio por turno</span>
              <span
                className={`flex min-h-12 items-center rounded-xl border-2 px-3.5 ${
                  createError ? "border-danger" : "border-line"
                }`}
              >
                <span className="mr-1.5 text-muted">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  aria-invalid={!!createError}
                  aria-describedby={createError ? "err-precio" : undefined}
                  className="w-full border-0 bg-transparent text-base text-ink outline-none"
                />
              </span>
              {createError && (
                <span id="err-precio" className="text-sm font-semibold text-danger">
                  {createError}
                </span>
              )}
            </label>
            <Button type="submit" variant="confirm" disabled={creating} className="mt-1">
              {creating ? "Guardando…" : "Guardar cancha"}
            </Button>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={!!disableTarget}
        onOpenChange={(open) => !open && setDisableTarget(null)}
        title={`¿Deshabilitar ${disableTarget?.name ?? ""}?`}
        description={`Se van a cancelar automáticamente sus ${
          disableTarget ? futureCounts[disableTarget.id] ?? 0 : 0
        } reservas futuras. Los jugadores las van a ver como canceladas por el club. Esto no se puede deshacer.`}
        confirmLabel={disabling ? "Deshabilitando…" : "Deshabilitar y cancelar reservas"}
        variant="danger"
        onConfirm={handleDisableConfirm}
      />
    </div>
  );
}
