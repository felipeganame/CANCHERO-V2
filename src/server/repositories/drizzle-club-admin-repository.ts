import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clubAdmins } from "@/server/db/schema";

export async function findClubIdByAdminUserId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ clubId: clubAdmins.clubId })
    .from(clubAdmins)
    .where(eq(clubAdmins.userId, userId));
  return row?.clubId ?? null;
}
