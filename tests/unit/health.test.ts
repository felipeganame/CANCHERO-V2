import { describe, it, expect } from "vitest";
import { ping } from "@/domain/health";

describe("ping", () => {
  it("CP-000 responde pong (test trivial de arranque del pipeline)", () => {
    expect(ping()).toBe("pong");
  });
});
