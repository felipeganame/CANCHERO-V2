import { describe, it, expect } from "vitest";
import { priceSchema } from "@/lib/validation/price";

describe("priceSchema", () => {
  it("CP-030 [RN-06] 0 es invalido (limite inferior)", () => {
    expect(priceSchema.safeParse(0).success).toBe(false);
  });

  it("CP-031 [RN-06] 1 es valido (limite inferior)", () => {
    expect(priceSchema.safeParse(1).success).toBe(true);
  });

  it("CP-032 [RN-06] -5 es invalido", () => {
    expect(priceSchema.safeParse(-5).success).toBe(false);
  });

  it("CP-033 [RN-06] 200000 es valido (tope)", () => {
    expect(priceSchema.safeParse(200000).success).toBe(true);
  });

  it("CP-034 [RN-06] 200001 es invalido (tope+1)", () => {
    expect(priceSchema.safeParse(200001).success).toBe(false);
  });

  it("CP-035 [RN-06] 'abc' es invalido", () => {
    expect(priceSchema.safeParse("abc").success).toBe(false);
  });

  it("CP-036 [RN-06] vacio es invalido", () => {
    expect(priceSchema.safeParse(undefined).success).toBe(false);
  });

  it("CP-037 [RN-06] decimal es invalido (precio es entero)", () => {
    expect(priceSchema.safeParse(100.5).success).toBe(false);
  });
});
