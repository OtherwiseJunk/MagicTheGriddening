import { describe, it, expect } from "vitest";
import { Game } from "@/models/database/game";
import { ConstraintType } from "@/models/UI/gameConstraint";

describe("Game model", () => {
  const constraints = JSON.stringify([
    { displayName: "Red", constraintType: ConstraintType.Color, scryfallQuery: "c:R" },
    { displayName: "Power 1", constraintType: ConstraintType.Power, scryfallQuery: "pow:1" },
  ]);

  describe("toUIObject", () => {
    it("parses constraintsJSON into GameConstraint array", () => {
      const game = new Game(1, "20260305", constraints);
      const result = game.toUIObject();

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe("Red");
      expect(result[1].scryfallQuery).toBe("pow:1");
    });
  });

  describe("dateStringToDate", () => {
    it("converts date string to Date object", () => {
      // Date strings use 0-indexed months (consistent with JS getMonth() and the seeder app)
      // So "20260305" means April 5th (month 03 = April in 0-indexed)
      const game = new Game(1, "20260305", "[]");
      const date = game.dateStringToDate();

      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3); // April (0-indexed)
      expect(date.getDate()).toBe(5);
    });
  });
});
