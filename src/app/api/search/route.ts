import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchClubs } from "@/server/services/search-service";
import { DrizzleSearchRepository } from "@/server/repositories/drizzle-search-repository";
import { DrizzleBookingRepository } from "@/server/repositories/drizzle-booking-repository";

const searchParamsSchema = z.object({
  deporte: z.enum(["futbol5", "futbol7", "padel", "tenis"]),
  ciudad: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    deporte: url.searchParams.get("deporte"),
    ciudad: url.searchParams.get("ciudad"),
    fecha: url.searchParams.get("fecha"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parametros invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await searchClubs(
    {
      sport: parsed.data.deporte,
      city: parsed.data.ciudad,
      localDate: parsed.data.fecha,
    },
    {
      search: new DrizzleSearchRepository(),
      bookings: new DrizzleBookingRepository(),
    },
  );

  return NextResponse.json(results);
}
