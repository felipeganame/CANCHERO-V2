import { describe, it, expect } from "vitest";
import { authClient, useSession, signIn, signOut } from "@/lib/auth-client";

describe("auth-client", () => {
  it("expone un cliente de Better Auth con sus helpers", () => {
    expect(authClient).toBeDefined();
    expect(typeof useSession).toBe("function");
    expect(typeof signIn.social).toBe("function");
    expect(typeof signOut).toBe("function");
  });
});
