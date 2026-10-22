import { describe, it, expect } from "vitest";
import { isPastOrStartedSlot, isValidSlotForClub } from "@/domain/slots";

describe("isPastOrStartedSlot", () => {
  it("CP-010 [RN-02] turno que ya empezo hace 1 minuto es invalido", () => {
    const now = new Date("2026-01-01T21:00:00.000Z");
    const slotStart = new Date("2026-01-01T20:59:00.000Z");
    expect(isPastOrStartedSlot(slotStart, now)).toBe(true);
  });

  it("CP-011 [RN-02] turno que empieza exactamente ahora es invalido", () => {
    const now = new Date("2026-01-01T21:00:00.000Z");
    expect(isPastOrStartedSlot(now, now)).toBe(true);
  });

  it("CP-012 [RN-02] turno que empieza en 1 minuto es valido", () => {
    const now = new Date("2026-01-01T21:00:00.000Z");
    const slotStart = new Date("2026-01-01T21:01:00.000Z");
    expect(isPastOrStartedSlot(slotStart, now)).toBe(false);
  });

  it("CP-013 [RN-02] turno de manana es valido", () => {
    const now = new Date("2026-01-01T21:00:00.000Z");
    const slotStart = new Date("2026-01-02T21:00:00.000Z");
    expect(isPastOrStartedSlot(slotStart, now)).toBe(false);
  });
});

describe("isValidSlotForClub", () => {
  const club = { openHour: 9, closeHour: 24, slotMinutes: 60 };

  it("CP-020 [RN-03] 21:00 local (00:00 UTC) dentro de horario y alineado es valido", () => {
    // Cordoba es UTC-3 todo el ano: 21:00 local = 00:00 UTC del dia siguiente.
    const slotStart = new Date("2026-01-02T00:00:00.000Z");
    expect(isValidSlotForClub(slotStart, club)).toBe(true);
  });

  it("CP-021 [RN-03] 21:30 local no esta alineado a slots de 60 min", () => {
    const slotStart = new Date("2026-01-02T00:30:00.000Z");
    expect(isValidSlotForClub(slotStart, club)).toBe(false);
  });

  it("CP-022 [RN-03] 08:00 local esta antes del horario de apertura", () => {
    const slotStart = new Date("2026-01-01T11:00:00.000Z");
    expect(isValidSlotForClub(slotStart, club)).toBe(false);
  });

  it("CP-023 [RN-03] 23:00 local es el ultimo turno valido del dia", () => {
    const slotStart = new Date("2026-01-02T02:00:00.000Z");
    expect(isValidSlotForClub(slotStart, club)).toBe(true);
  });

  it("CP-024 [RN-03] 00:00 local esta fuera de horario (club cierra a las 24)", () => {
    const slotStart = new Date("2026-01-02T03:00:00.000Z");
    expect(isValidSlotForClub(slotStart, club)).toBe(false);
  });
});
