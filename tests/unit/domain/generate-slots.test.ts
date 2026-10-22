import { describe, it, expect } from "vitest";
import { generateSlotsForLocalDate } from "@/domain/slots";

describe("generateSlotsForLocalDate", () => {
  it("CP-080 genera un slot por cada hora entre apertura y cierre", () => {
    const club = { openHour: 21, closeHour: 24, slotMinutes: 60 };
    // 2 de enero 2026 (Cordoba) -> apertura 21:00 local = 2026-01-03T00:00:00Z
    const slots = generateSlotsForLocalDate(club, "2026-01-02");

    expect(slots).toHaveLength(3);
    expect(slots[0]?.toISOString()).toBe("2026-01-03T00:00:00.000Z");
    expect(slots[1]?.toISOString()).toBe("2026-01-03T01:00:00.000Z");
    expect(slots[2]?.toISOString()).toBe("2026-01-03T02:00:00.000Z");
  });
});
