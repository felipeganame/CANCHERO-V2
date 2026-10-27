import { defineConfig } from "vitest/config";
import path from "node:path";

// Config separada a proposito: estos tests corren contra la base real de
// QA en Supabase (etapa 2 del pipeline, deploy-qa), no contra el Postgres
// efimero de Testcontainers que usa tests/integration/*.test.ts (etapa 1).
// Por eso no viven en vitest.config.ts: si estuvieran en el mismo array de
// projects, "pnpm coverage" (que no filtra por --project) los correria en
// la etapa 1 contra la base equivocada.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration-qa/**/*.test.ts"],
  },
});
