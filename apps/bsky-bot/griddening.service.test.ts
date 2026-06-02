import {
  getDailyPuzzleScreenshot,
  getDailyPuzzleAltText,
  getPostText,
  getDescriptionForConstraint,
  generateAltTextFromGameState,
  getPuppeteerOptionsByEnv,
  ensureBotLabel,
  repostDailyPuzzle,
  BOT_LABEL,
} from "./griddening.service";
import fs from "fs";

jest.mock("puppeteer", () => ({
  __esModule: true,
  default: {
    launch: jest.fn(),
  },
}));

import puppeteer from "puppeteer";

const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  setViewport: jest.fn().mockResolvedValue(undefined),
  addStyleTag: jest.fn().mockResolvedValue(undefined),
  evaluate: jest.fn().mockResolvedValue(undefined),
  screenshot: jest.fn().mockResolvedValue(Buffer.from([137, 80, 78, 71])),
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};

const descriptionForConstraintTestCases = [
  { constraintType: 0, displayName: "Mythic", expectedText: "Mythic (Rarity)" },
  { constraintType: 1, displayName: "Sorcery", expectedText: "Sorcery (Type)" },
  { constraintType: 2, displayName: "Mana Value 3", expectedText: "Mana Value 3" },
  { constraintType: 3, displayName: "Red", expectedText: "Red (Color)" },
  {
    constraintType: 4,
    displayName: "Battle for Zendikar",
    expectedText: "Battle for Zendikar (Set)",
  },
  { constraintType: 5, displayName: "Power 5", expectedText: "Power 5" },
  { constraintType: 6, displayName: "Toughness 5", expectedText: "Toughness 5" },
  { constraintType: 7, displayName: "Artist: John Avon", expectedText: "Artist: John Avon" },
  { constraintType: 8, displayName: "Trample", expectedText: "Trample (Rules Text)" },
  { constraintType: 9, displayName: "Vampire", expectedText: "Vampire (Creature Type)" },
  { constraintType: 10, displayName: "Cleric", expectedText: "Cleric (Creature Type)" },
  { constraintType: 11, displayName: "Equipment", expectedText: "Equipment (Artifact Type)" },
  { constraintType: 12, displayName: "Aura", expectedText: "Aura (Enchantment Type)" },
];

const gameStateTestCase = {
  correctGuesses: [],
  gameConstraints: [
    { constraintType: 0, displayName: "Mythic" },
    { constraintType: 1, displayName: "Sorcery" },
    { constraintType: 2, displayName: "Mana Value 3" },
    { constraintType: 3, displayName: "Red" },
    { constraintType: 4, displayName: "Battle for Zendikar" },
    { constraintType: 5, displayName: "Power 5" },
  ],
  lifepoints: 9,
  expectedText: `A Magic The Griddening Puzzle.
The puzzle is a 3x3 grid of inputs, with the following constraints:
Top row: Mythic (Rarity), Sorcery (Type), Mana Value 3
Side row: Red (Color), Battle for Zendikar (Set), Power 5
The board is blank.`,
};

function cleanup() {
  for (const file of ["screenshot.png", "dailyPuzzle.png"]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
}

describe("GriddeningService", () => {
  beforeAll(() => {
    cleanup();
  });
  afterAll(() => {
    cleanup();
  });

  describe("getDailyPuzzleScreenshot", () => {
    beforeEach(() => {
      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
    });

    it("returns a Uint8Array", async () => {
      const result = await getDailyPuzzleScreenshot();
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("closes the browser even if an error occurs", async () => {
      mockPage.screenshot.mockRejectedValueOnce(new Error("screenshot failed"));
      await expect(getDailyPuzzleScreenshot()).rejects.toThrow("screenshot failed");
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("getDailyPuzzleAltText", () => {
    it("returns expected alt text", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(gameStateTestCase),
      });
      const altText = await getDailyPuzzleAltText();
      expect(altText).toBe(gameStateTestCase.expectedText);
    });
  });

  describe("generateAltTextFromGameState", () => {
    it("returns expected alt text", () => {
      expect(generateAltTextFromGameState(gameStateTestCase)).toBe(gameStateTestCase.expectedText);
    });
  });

  describe("getDescriptionForConstraint", () => {
    for (const testCase of descriptionForConstraintTestCases) {
      it(`returns expected string for ${testCase.displayName}`, () => {
        expect(getDescriptionForConstraint(testCase)).toBe(testCase.expectedText);
      });
    }
  });

  describe("getPostText", () => {
    it("returns the expected string", () => {
      expect(getPostText()).toBe(`Good luck with today's puzzle!

https://magicthegridden.ing

#MagicTheGathering
#MagicTheGriddening`);
    });
  });

  describe("getPuppeteerOptionsByEnv", () => {
    afterEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("returns production options when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      expect(getPuppeteerOptionsByEnv()).toEqual({
        executablePath: "/usr/bin/google-chrome-stable",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    });

    it("returns empty object for non-production NODE_ENV", () => {
      expect(getPuppeteerOptionsByEnv()).toEqual({});
    });
  });

  describe("repostDailyPuzzle", () => {
    function makeRepostAgent() {
      return {
        login: jest.fn().mockResolvedValue({ success: true }),
        repost: jest.fn().mockResolvedValue({}),
      };
    }

    it("does nothing when lastPostUri is undefined", async () => {
      const agent = makeRepostAgent();
      await repostDailyPuzzle(agent as any, undefined);
      expect(agent.login).not.toHaveBeenCalled();
      expect(agent.repost).not.toHaveBeenCalled();
    });

    it("logs in and reposts when lastPostUri is set", async () => {
      const agent = makeRepostAgent();
      const uri = { uri: "at://did:plc:test/post/abc", cid: "bafytest" };
      await repostDailyPuzzle(agent as any, uri);
      expect(agent.login).toHaveBeenCalled();
      expect(agent.repost).toHaveBeenCalledWith(uri.uri, uri.cid);
    });
  });

  describe("ensureBotLabel", () => {
    function makeAgent(labels?: { val: string }[]) {
      return {
        session: { did: "did:plc:test123" },
        api: {
          com: {
            atproto: {
              repo: {
                getRecord: jest.fn().mockResolvedValue({
                  data: {
                    record: {
                      displayName: "Test Bot",
                      ...(labels !== undefined && {
                        labels: { values: labels },
                      }),
                    },
                  },
                }),
                putRecord: jest.fn().mockResolvedValue({}),
              },
            },
          },
        },
      };
    }

    it("does nothing when no session exists", async () => {
      const agent = makeAgent();
      agent.session = undefined as any;
      await ensureBotLabel(agent as any);
      expect(agent.api.com.atproto.repo.getRecord).not.toHaveBeenCalled();
    });

    it("does not putRecord when label already present", async () => {
      const agent = makeAgent([{ val: BOT_LABEL }]);
      await ensureBotLabel(agent as any);
      expect(agent.api.com.atproto.repo.putRecord).not.toHaveBeenCalled();
    });

    it("adds label when profile has no labels", async () => {
      const agent = makeAgent();
      await ensureBotLabel(agent as any);
      expect(agent.api.com.atproto.repo.putRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          record: expect.objectContaining({
            labels: {
              $type: "com.atproto.label.defs#selfLabels",
              values: [{ val: BOT_LABEL }],
            },
          }),
        }),
      );
    });

    it("preserves existing labels when adding the bot label", async () => {
      const agent = makeAgent([{ val: "existing-label" }]);
      await ensureBotLabel(agent as any);
      expect(agent.api.com.atproto.repo.putRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          record: expect.objectContaining({
            labels: {
              $type: "com.atproto.label.defs#selfLabels",
              values: [{ val: "existing-label" }, { val: BOT_LABEL }],
            },
          }),
        }),
      );
    });
  });
});
