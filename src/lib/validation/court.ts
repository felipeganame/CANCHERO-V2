import { z } from "zod";
import { priceSchema } from "./price";

export const createCourtSchema = z.object({
  name: z.string().min(1),
  sport: z.enum(["futbol5", "futbol7", "padel", "tenis"]),
  pricePerSlot: priceSchema,
});

export const updateCourtSchema = z.object({
  pricePerSlot: priceSchema.optional(),
  active: z.boolean().optional(),
});
