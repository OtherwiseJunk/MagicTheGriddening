import { describe, it, expect, afterEach, vi } from "vitest";
import { writeFile, rm, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildCardIndex } from "@griddening/shared";

// Count createReadStream invocations by wrapping the real node:fs export. buildCardIndex
// reads the bulk file via streamCards -> createReadStream, so call count == number of passes.
// vi.mock is hoisted above the imports, so the static buildCardIndex import sees the wrapper.
const h = vi.hoisted(() => ({ reads: 0 }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    createReadStream: (...args: Parameters<typeof actual.createReadStream>) => {
      h.reads++;
      return actual.createReadStream(...args);
    },
  };
});

const tmpFiles: string[] = [];
afterEach(async () => {
  await Promise.all(tmpFiles.splice(0).map((f) => rm(f, { force: true })));
});

describe("buildCardIndex streaming", () => {
  it("reads the bulk file exactly once (single streaming pass)", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "bci-pass-"));
    const file = path.join(dir, "bulk.json");
    tmpFiles.push(file);
    await writeFile(
      file,
      JSON.stringify([
        { name: "Card A", oracle_id: "a", lang: "en", games: ["paper"], colors: [], cmc: 0 },
        { name: "Card B", oracle_id: "b", lang: "en", games: ["paper"], colors: [], cmc: 0 },
      ]),
      "utf8",
    );

    h.reads = 0;
    const { cards } = await buildCardIndex(file);

    expect(cards).toHaveLength(2);
    expect(h.reads).toBe(1);
  });
});
