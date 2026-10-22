import { z } from "zod";

export const createBookingSchema = z.object({
  courtId: z.string().min(1),
  startsAt: z.string().datetime(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
