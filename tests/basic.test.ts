import { describe, it, expect } from "vitest";
import { enrichEmail } from "../src";

describe("enrichEmail", () => {
  it("rejects invalid email", async () => {
    await expect(enrichEmail("nope")).rejects.toThrow();
  });

  it("returns structure", async () => {
    const res = await enrichEmail("someone@example.com");
    expect(res.email).toBe("someone@example.com");
    expect(res.meta.attempted_providers.length).toBeGreaterThan(0);
    expect(res.profiles).toBeTypeOf("object");
  });
});