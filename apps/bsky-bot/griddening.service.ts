import puppeteer from "puppeteer";
import fs from "fs";

const url = "https://magicthegridden.ing";
const screenshotPath = "./dailyPuzzle.png";
const gameStateUrl = "https://magicthegridden.ing/api/gameState/screenshotPoster";
export enum ConstraintType {
  Rarity,
  Type,
  ManaValue,
  Color,
  Set,
  Power,
  Toughness,
  Artist,
  CreatureRulesText,
  CreatureRaceTypes,
  CreatureJobTypes,
  ArtifactSubtypes,
  EnchantmentSubtypes,
  __LENGTH,
}

export function getPuppeteerOptionsByEnv() {
  return process.env.NODE_ENV !== "production"
    ? {}
    : {
        executablePath: "/usr/bin/google-chrome-stable",
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      };
}

export async function getDailyPuzzleScreenshot(): Promise<Uint8Array> {
  const puppeteerOptions = getPuppeteerOptionsByEnv();
  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.setViewport({ width: 800, height: 1000 });
  await page.addStyleTag({ content: "body { color: white; }" });
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.screenshot({ path: screenshotPath });
  await browser.close();

  return fs.readFileSync(screenshotPath);
}

export async function getDailyPuzzleAltText(): Promise<string> {
  let response = await fetch(gameStateUrl);
  let data = await response.json();
  return generateAltTextFromGameState(data);
}

export function generateAltTextFromGameState(game: any): string {
  const topRowDescOne = getDescriptionForConstraint(game.gameConstraints[0]);
  const topRowDescTwo = getDescriptionForConstraint(game.gameConstraints[1]);
  const topRowDescThree = getDescriptionForConstraint(game.gameConstraints[2]);
  const sideRowDescOne = getDescriptionForConstraint(game.gameConstraints[3]);
  const sideRowDescTwo = getDescriptionForConstraint(game.gameConstraints[4]);
  const sideRowDescThree = getDescriptionForConstraint(game.gameConstraints[5]);

  return `A Magic The Griddening Puzzle.
The puzzle is a 3x3 grid of inputs, with the following constraints:
Top row: ${topRowDescOne}, ${topRowDescTwo}, ${topRowDescThree}
Side row: ${sideRowDescOne}, ${sideRowDescTwo}, ${sideRowDescThree}
The board is blank.`;
}

export function getDescriptionForConstraint(constraint: any) {
  switch (constraint.constraintType) {
    case ConstraintType.ManaValue:
      return `${constraint.displayName}`;
    case ConstraintType.Artist:
      return `${constraint.displayName}`;
    case ConstraintType.Power:
      return `${constraint.displayName}`;
    case ConstraintType.Toughness:
      return `${constraint.displayName}`;
    case ConstraintType.CreatureRulesText:
      return `${constraint.displayName} (Rules Text)`;
    case ConstraintType.CreatureRaceTypes:
      return `${constraint.displayName} (Creature Type)`;
    case ConstraintType.CreatureJobTypes:
      return `${constraint.displayName} (Creature Type)`;
    case ConstraintType.ArtifactSubtypes:
      return `${constraint.displayName} (Artifact Type)`;
    case ConstraintType.EnchantmentSubtypes:
      return `${constraint.displayName} (Enchantment Type)`;
    default:
      return `${constraint.displayName} (${ConstraintType[constraint.constraintType]})`;
  }
}

export function getPostText() {
  return `Good luck with today's puzzle!

https://magicthegridden.ing

#MagicTheGathering
#MagicTheGriddening`;
}
