export function isPastOrStartedSlot(slotStart: Date, now: Date): boolean {
  return slotStart <= now;
}

export interface ClubSchedule {
  openHour: number;
  closeHour: number;
  slotMinutes: number;
}

// Cordoba (America/Argentina/Cordoba) es UTC-3 todo el ano, sin horario de verano.
const CORDOBA_UTC_OFFSET_HOURS = -3;

export function isValidSlotForClub(
  slotStart: Date,
  club: ClubSchedule,
): boolean {
  const localMs = slotStart.getTime() + CORDOBA_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const local = new Date(localMs);
  const localHour = local.getUTCHours();
  const localMinutes = local.getUTCMinutes();

  if (localMinutes % club.slotMinutes !== 0) return false;
  if (localHour < club.openHour) return false;
  if (localHour >= club.closeHour) return false;

  return true;
}

/** `localDate` en formato "YYYY-MM-DD", calendario de America/Argentina/Cordoba. */
export function generateSlotsForLocalDate(
  club: ClubSchedule,
  localDate: string,
): Date[] {
  const [year, month, day] = localDate.split("-").map(Number);
  const slots: Date[] = [];

  for (let hour = club.openHour; hour < club.closeHour; hour += club.slotMinutes / 60) {
    // Fecha/hora local interpretada como UTC, luego se resta el offset
    // de Cordoba para obtener el instante UTC real.
    const localAsUtc = Date.UTC(year!, month! - 1, day, hour, 0, 0);
    const utcMs = localAsUtc - CORDOBA_UTC_OFFSET_HOURS * 60 * 60 * 1000;
    slots.push(new Date(utcMs));
  }

  return slots;
}
