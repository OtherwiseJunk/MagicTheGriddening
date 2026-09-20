import { describe, it, expect } from "vitest";
import { GriddeningService } from "../services/griddening.service.js";
import { DataService } from "../services/data.service.js";
import { prismaMock } from "../__mocks__/databaseClient.js";

describe("dateString write/read round-trip", () => {
  const griddeningService = new GriddeningService();
  const dataService = new DataService(prismaMock);

  it("decodes today's generated dateString back to today's real calendar date", () => {
    const today = new Date();
    const dateString = griddeningService.getDateStringByOffset(0);
    const decoded = dataService.dateStringToDate(dateString);

    expect(decoded).toBeDefined();
    expect(decoded!.getFullYear()).toBe(today.getFullYear());
    expect(decoded!.getMonth()).toBe(today.getMonth());
    expect(decoded!.getDate()).toBe(today.getDate());
  });

  it("decodes a January dateString back to January, not December of the previous year", () => {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let target = new Date(today.getFullYear(), 0, 15);
    if (target.getTime() <= todayMidnight.getTime()) {
      target = new Date(today.getFullYear() + 1, 0, 15);
    }

    const dayOffset = (target.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24);

    const dateString = griddeningService.getDateStringByOffset(dayOffset);
    const decoded = dataService.dateStringToDate(dateString);

    expect(decoded).toBeDefined();
    expect(decoded!.getFullYear()).toBe(target.getFullYear());
    expect(decoded!.getMonth()).toBe(0); // January
    expect(decoded!.getDate()).toBe(15);
  });
});
