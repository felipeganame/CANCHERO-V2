import { randomUUID } from "node:crypto";
import { priceSchema } from "@/lib/validation/price";
import type { Court, CourtRepository } from "@/server/repositories/types";

export interface CreateCourtInput {
  clubId: string;
  name: string;
  sport: Court["sport"];
  pricePerSlot: number;
}

export interface CreateCourtDeps {
  courts: CourtRepository;
}

export async function createCourt(
  input: CreateCourtInput,
  deps: CreateCourtDeps,
): Promise<Court> {
  priceSchema.parse(input.pricePerSlot);

  return deps.courts.create({
    id: randomUUID(),
    clubId: input.clubId,
    name: input.name,
    sport: input.sport,
    pricePerSlot: input.pricePerSlot,
  });
}
