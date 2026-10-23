// Cordoba (America/Argentina/Cordoba) es UTC-3 todo el ano, sin horario de verano.
const CORDOBA_UTC_OFFSET_HOURS = -3;

function toCordobaLocal(iso: string): Date {
  return new Date(new Date(iso).getTime() + CORDOBA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

export function formatSlotHour(iso: string): string {
  const local = toCordobaLocal(iso);
  const h = local.getUTCHours().toString().padStart(2, "0");
  const m = local.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatPriceARS(n: number): string {
  return `$ ${n.toLocaleString("es-AR")}`;
}

export function formatSlotRange(
  startsAtIso: string,
  slotMinutes = 60,
): { day: string; range: string } {
  const startLocal = toCordobaLocal(startsAtIso);
  const endIso = new Date(
    new Date(startsAtIso).getTime() + slotMinutes * 60 * 1000,
  ).toISOString();

  const day = startLocal.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });

  return {
    day,
    range: `${formatSlotHour(startsAtIso)} – ${formatSlotHour(endIso)}`,
  };
}

export function formatLocalDateLong(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
