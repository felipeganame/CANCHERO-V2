import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "node:child_process";

let container: StartedPostgreSqlContainer | null = null;

export async function startTestDatabase(): Promise<string> {
  container = await new PostgreSqlContainer("postgres:17").start();
  const url = container.getConnectionUri();
  execSync("pnpm db:migrate", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  return url;
}

export async function stopTestDatabase(): Promise<void> {
  await container?.stop();
  container = null;
}
