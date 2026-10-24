import { describe, it, expect } from "vitest";
import { createBookingSchema } from "@/lib/validation/booking";

describe("createBookingSchema", () => {
  it("acepta courtId y startsAt validos", () => {
    const result = createBookingSchema.safeParse({
      courtId: "court-1",
      startsAt: "2026-10-26T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza courtId vacio", () => {
    expect(
      createBookingSchema.safeParse({ courtId: "", startsAt: "2026-10-26T00:00:00.000Z" })
        .success,
    ).toBe(false);
  });

  it("rechaza startsAt que no es ISO datetime", () => {
    expect(
      createBookingSchema.safeParse({ courtId: "court-1", startsAt: "mañana" }).success,
    ).toBe(false);
  });
});
