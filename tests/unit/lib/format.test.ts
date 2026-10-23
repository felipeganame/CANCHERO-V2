import { describe, it, expect } from "vitest";
import { formatSlotHour, formatPriceARS, formatLocalDateLong, formatSlotRange } from "@/lib/format";

describe("formatSlotHour", () => {
  it("convierte un ISO en UTC a HH:MM en horario de Cordoba (UTC-3)", () => {
    expect(formatSlotHour("2026-10-26T00:00:00.000Z")).toBe("21:00");
  });

  it("agrega ceros a la izquierda en hora y minutos", () => {
    expect(formatSlotHour("2026-10-26T09:05:00.000Z")).toBe("06:05");
  });
});

describe("formatPriceARS", () => {
  it("formatea un precio entero con separador de miles es-AR", () => {
    expect(formatPriceARS(30000)).toBe("$ 30.000");
  });

  it("formatea precios de un digito sin separador", () => {
    expect(formatPriceARS(500)).toBe("$ 500");
  });
});

describe("formatLocalDateLong", () => {
  it("formatea YYYY-MM-DD como fecha larga en espanol", () => {
    expect(formatLocalDateLong("2026-10-25")).toBe("domingo, 25 de octubre");
  });

  it("devuelve el string original si el formato es invalido", () => {
    expect(formatLocalDateLong("no-es-una-fecha")).toBe("no-es-una-fecha");
  });
});

describe("formatSlotRange", () => {
  it("devuelve dia corto y rango horario de 1 hora en Cordoba", () => {
    const result = formatSlotRange("2026-10-26T00:00:00.000Z");
    expect(result.day).toBe("domingo 25-10");
    expect(result.range).toBe("21:00 – 22:00");
  });
});
