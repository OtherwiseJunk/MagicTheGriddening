import { expect, test, describe } from "vitest";
import { calculateOffsetFromToday, calculateStartingDayOffset } from "../main.js";

describe("Main", () => {
  describe("calculateOffsetFromToday", () => {
    test("should return 0 if date passed in is today", async () => {
      expect(calculateOffsetFromToday(new Date())).toBe(0);
    });
    test("should return 1 if date passed in is one day past today", async () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      expect(calculateOffsetFromToday(date)).toBe(1);
    });
    test("should return -1 if date passed in is one day before today", async () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      expect(calculateOffsetFromToday(date)).toBe(-1);
    });
  });

  describe("calculateStartingDayOffset", () => {
    test("returns -1 when no games exist so first puzzle is today", () => {
      expect(calculateStartingDayOffset(undefined)).toBe(-1);
    });
    test("returns offset of newest game when games exist", () => {
      const date = new Date();
      date.setDate(date.getDate() + 3);
      expect(calculateStartingDayOffset(date)).toBe(3);
    });
  });
});
