import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const client = postgres(connectionString, {
  prepare: false,
  ssl: isLocal ? false : "require",
});

export const db = drizzle(client, { schema });
