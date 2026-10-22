import { z } from "zod";

// RN-06: precio por turno, entero mayor a 0 y hasta $200.000.
export const priceSchema = z.number().int().min(1).max(200000);
