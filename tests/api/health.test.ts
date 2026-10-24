import { describe, it, expect, vi } from "vitest";

const execute = vi.fn();
vi.mock("@/server/db/client", () => ({
  db: { execute: (...args: unknown[]) => execute(...args) },
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("CP-220 responde ok cuando la DB contesta", async () => {
    execute.mockResolvedValue(undefined);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("CP-221 responde 503 cuando la DB falla", async () => {
    execute.mockRejectedValue(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
  });
});
