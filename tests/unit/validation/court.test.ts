import { describe, it, expect } from "vitest";
import { createCourtSchema, updateCourtSchema } from "@/lib/validation/court";

describe("createCourtSchema", () => {
  it("acepta datos validos", () => {
    const result = createCourtSchema.safeParse({
      name: "Cancha 1",
      sport: "futbol5",
      pricePerSlot: 30000,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacio", () => {
    expect(
      createCourtSchema.safeParse({ name: "", sport: "futbol5", pricePerSlot: 30000 })
        .success,
    ).toBe(false);
  });

  it("rechaza un deporte invalido", () => {
    expect(
      createCourtSchema.safeParse({ name: "Cancha 1", sport: "rugby", pricePerSlot: 30000 })
        .success,
    ).toBe(false);
  });

  it("[RN-06] rechaza precio fuera de rango", () => {
    expect(
      createCourtSchema.safeParse({ name: "Cancha 1", sport: "futbol5", pricePerSlot: 0 })
        .success,
    ).toBe(false);
  });
});

describe("updateCourtSchema", () => {
  it("acepta solo active", () => {
    expect(updateCourtSchema.safeParse({ active: false }).success).toBe(true);
  });

  it("acepta solo pricePerSlot", () => {
    expect(updateCourtSchema.safeParse({ pricePerSlot: 15000 }).success).toBe(true);
  });

  it("acepta objeto vacio (ambos opcionales)", () => {
    expect(updateCourtSchema.safeParse({}).success).toBe(true);
  });

  it("[RN-06] rechaza pricePerSlot fuera de rango", () => {
    expect(updateCourtSchema.safeParse({ pricePerSlot: 300000 }).success).toBe(false);
  });
});
