import {
  getDailyPuzzleScreenshot,
  getDailyPuzzleAltText,
  getPostText,
  getDescriptionForConstraint,
  generateAltTextFromGameState,
  getPuppeteerOptionsByEnv,
} from "./griddening.service";
import fs from "fs";
import PNG from "png-js";

const descriptionForConstraintTestCases = [
  {
    constraintType: 0,
    displayName: "Mythic",
    expectedText: "Mythic (Rarity)",
  },
  {
    constraintType: 1,
    displayName: "Sorcery",
    expectedText: "Sorcery (Type)",
  },
  {
    constraintType: 2,
    displayName: "Mana Value 3",
    expectedText: "Mana Value 3",
  },
  {
    constraintType: 3,
    displayName: "Red",
    expectedText: "Red (Color)",
  },
  {
    constraintType: 4,
    displayName: "Battle for Zendikar",
    expectedText: "Battle for Zendikar (Set)",
  },
  {
    constraintType: 5,
    displayName: "Power 5",
    expectedText: "Power 5",
  },
  {
    constraintType: 6,
    displayName: "Toughness 5",
    expectedText: "Toughness 5",
  },
  {
    constraintType: 7,
    displayName: "Artist: John Avon",
    expectedText: "Artist: John Avon",
  },
  {
    constraintType: 8,
    displayName: "Trample",
    expectedText: "Trample (Rules Text)",
  },
  {
    constraintType: 9,
    displayName: "Vampire",
    expectedText: "Vampire (Creature Type)",
  },
  {
    constraintType: 10,
    displayName: "Cleric",
    expectedText: "Cleric (Creature Type)",
  },
  {
    constraintType: 11,
    displayName: "Equipment",
    expectedText: "Equipment (Artifact Type)",
  },
  {
    constraintType: 12,
    displayName: "Aura",
    expectedText: "Aura (Enchantment Type)",
  },
];
const gameStateTestCase = {
  correctGuesses: [],
  gameConstraints: [
    {
      constraintType: 0,
      displayName: "Mythic",
    },
    {
      constraintType: 1,
      displayName: "Sorcery",
    },
    {
      constraintType: 2,
      displayName: "Mana Value 3",
    },
    {
      constraintType: 3,
      displayName: "Red",
    },
    {
      constraintType: 4,
      displayName: "Battle for Zendikar",
    },
    {
      constraintType: 5,
      displayName: "Power 5",
    },
  ],
  lifepoints: 9,
  expectedText: `A Magic The Griddening Puzzle.
The puzzle is a 3x3 grid of inputs, with the following constraints:
Top row: Mythic (Rarity), Sorcery (Type), Mana Value 3
Side row: Red (Color), Battle for Zendikar (Set), Power 5
The board is blank.`,
};

function cleanup() {
  if (fs.existsSync("screenshot.png")) {
    fs.unlinkSync("screenshot.png");
  }
  if (fs.existsSync("dailyPuzzle.png")) {
    fs.unlinkSync("dailyPuzzle.png");
  }
}

describe("GriddeningService", () => {
  beforeAll(() => {
    cleanup();
  });
  afterAll(() => {
    //cleanup();
  });
  describe("getDailyPuzzleScreenshot", () => {
    it("should return a UInt8Array", async () => {
      const screenshot = await getDailyPuzzleScreenshot();
      expect(screenshot).toBeInstanceOf(Uint8Array);
    }, 12000);
    it("should return a UInt8Array that represents a 800x650 screenshot", async () => {
      const screenshot = await getDailyPuzzleScreenshot();
      fs.writeFileSync("screenshot.png", screenshot);
      let image = PNG.load("screenshot.png");
      expect(image.height).toBe(650);
      expect(image.width).toBe(800);
    }, 12000);
  });
  describe("getDailyPuzzleAltText", () => {
    it("should return expected alt text", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(gameStateTestCase),
      });
      const altText = await getDailyPuzzleAltText();
      expect(altText).toBe(gameStateTestCase.expectedText);
    });
  });
  describe("generateAltTextFromGameState", () => {
    it("should return expected alt text", () => {
      const altText = generateAltTextFromGameState(gameStateTestCase);
      expect(altText).toBe(gameStateTestCase.expectedText);
    });
  });
  describe("getDescriptionForConstraint", () => {
    for (const testCase of descriptionForConstraintTestCases) {
      it(`should return the expected string for ${testCase.displayName}`, () => {
        expect(getDescriptionForConstraint(testCase)).toBe(testCase.expectedText);
      });
    }
  });
  describe("getPostText", () => {
    it("should return the expected string", () => {
      const expextedText = `Good luck with today's puzzle!

https://magicthegridden.ing

#MagicTheGathering
#MagicTheGriddening`;
      expect(getPostText()).toBe(expextedText);
    });
  });

  describe("getPuppeteerOptionsByEnv", () => {
    afterEach(() => {
      process.env.NODE_ENV = "test";
    });
    it("should return production options for productions NODE_ENVs", () => {
      process.env.NODE_ENV = "production";
      expect(getPuppeteerOptionsByEnv()).toEqual({
        executablePath: "/usr/bin/google-chrome",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    });
    it("should return a blank object for non-production NODE_ENVs", () => {
      expect(getPuppeteerOptionsByEnv()).toEqual({});
    });
  });
});
