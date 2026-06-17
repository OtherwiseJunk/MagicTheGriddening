import { describe, it, expect } from "vitest";
import { generateShortCode } from "@/lib/shortCode";

describe("generateShortCode", () => {
  it("returns a string matching XXXX-DDDD format", () => {
    const code = generateShortCode();
    expect(code).toMatch(/^[A-Z]{4}-\d{4}$/);
  });

  it("generates different codes on repeated calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateShortCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
