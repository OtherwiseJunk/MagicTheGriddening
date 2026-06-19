import { describe, it, expect } from "vitest";
import {
  allConstraints,
  findConstraintByName,
  ConstraintType,
} from "@griddening/shared";

describe("constraint registry", () => {
  it("resolves a known constraint name to its type and query", () => {
    const c = findConstraintByName("Mark Poole");
    expect(c).toBeDefined();
    expect(c!.constraintType).toBe(ConstraintType.Artist);
    expect(c!.scryfallQuery).toBe("a:Poole");
  });

  it("resolves names case-insensitively", () => {
    const lower = findConstraintByName("mark poole");
    const upper = findConstraintByName("MARK POOLE");
    expect(lower).toBeDefined();
    expect(lower).toBe(upper);
    expect(lower!.constraintType).toBe(ConstraintType.Artist);
  });

  it("resolves a mana value constraint", () => {
    const c = findConstraintByName("Mana Value 1");
    expect(c).toBeDefined();
    expect(c!.constraintType).toBe(ConstraintType.ManaValue);
    expect(c!.scryfallQuery).toBe("cmc:1");
  });

  it("returns undefined for an unknown name", () => {
    expect(findConstraintByName("Not A Real Constraint")).toBeUndefined();
  });

  it("carries a localFilter on every constraint", () => {
    for (const c of allConstraints) {
      expect(typeof c.localFilter).toBe("function");
    }
  });

  it("has no duplicate display names (resolution stays unambiguous)", () => {
    const names = allConstraints.map((c) => c.displayName.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("represents every constraint type except Set (dynamic) and __LENGTH", () => {
    const present = new Set(allConstraints.map((c) => c.constraintType));
    for (let type = 0; type < ConstraintType.__LENGTH; type++) {
      if (type === ConstraintType.Set) continue;
      expect(present.has(type)).toBe(true);
    }
  });
});
