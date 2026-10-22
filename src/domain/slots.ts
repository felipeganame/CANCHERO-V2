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
