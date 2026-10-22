import { describe, it, expect } from "vitest";
import { createCourt } from "@/server/services/create-court-service";
import { FakeCourtRepository } from "@/server/repositories/fakes";

describe("createCourt", () => {
  it("CP-070 crea una cancha activa con precio valido", async () => {
    const courts = new FakeCourtRepository();

    const court = await createCourt(
      { clubId: "club-1", name: "Cancha 1", sport: "padel", pricePerSlot: 15000 },
      { courts },
    );

    expect(court.active).toBe(true);
    expect(court.pricePerSlot).toBe(15000);
  });

  it("CP-071 [RN-06] rechaza precio invalido (0)", async () => {
    const courts = new FakeCourtRepository();

    await expect(
      createCourt(
        { clubId: "club-1", name: "Cancha 1", sport: "padel", pricePerSlot: 0 },
        { courts },
      ),
    ).rejects.toThrow();
  });
});
