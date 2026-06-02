import puppeteer from "puppeteer";
import { BskyAgent } from "@atproto/api";

const url = "https://magicthegridden.ing";
const gameStateUrl = "https://magicthegridden.ing/api/gameState/screenshotPoster";

export const BOT_LABEL = "!automated";

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
  const browser = await puppeteer.launch(getPuppeteerOptionsByEnv());
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.setViewport({ width: 800, height: 1000 });
    await page.addStyleTag({ content: "body { color: white; }" });
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    return new Uint8Array(await page.screenshot());
  } finally {
    await browser.close();
  }
}

export async function getDailyPuzzleAltText(): Promise<string> {
  const response = await fetch(gameStateUrl);
  const data = await response.json();
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
    case ConstraintType.Artist:
    case ConstraintType.Power:
    case ConstraintType.Toughness:
      return `${constraint.displayName}`;
    case ConstraintType.CreatureRulesText:
      return `${constraint.displayName} (Rules Text)`;
    case ConstraintType.CreatureRaceTypes:
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

export async function repostDailyPuzzle(
  agent: BskyAgent,
  lastPostUri: { uri: string; cid: string } | undefined,
): Promise<void> {
  if (!lastPostUri) return;
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
  await agent.repost(lastPostUri.uri, lastPostUri.cid);
  console.log("Just reposted!");
}

export async function ensureBotLabel(agent: BskyAgent): Promise<void> {
  const did = agent.session?.did;
  if (!did) return;

  const { data } = await agent.api.com.atproto.repo.getRecord({
    repo: did,
    collection: "app.bsky.actor.profile",
    rkey: "self",
  });

  const record = data.record as Record<string, unknown>;
  const labels = record.labels as { values?: { val: string }[] } | undefined;

  if (labels?.values?.some((l) => l.val === BOT_LABEL)) return;

  await agent.api.com.atproto.repo.putRecord({
    repo: did,
    collection: "app.bsky.actor.profile",
    rkey: "self",
    record: {
      ...record,
      labels: {
        $type: "com.atproto.label.defs#selfLabels",
        values: [...(labels?.values ?? []), { val: BOT_LABEL }],
      },
    },
  });
  console.log("Bot label registered.");
}
