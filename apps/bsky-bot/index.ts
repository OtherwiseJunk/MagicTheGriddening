import { BskyAgent, RichText } from "@atproto/api";
import * as dotenv from "dotenv";
import { CronJob } from "cron";
import * as process from "process";
import { getDailyPuzzleAltText, getDailyPuzzleScreenshot, getPostText } from "./griddening.service";

dotenv.config();

// Create a Bluesky Agent
const agent = new BskyAgent({
  service: "https://bsky.social",
});

let lastPostUri: { uri: string; cid: string } | undefined;

async function postPuzzleInAM() {
  lastPostUri = undefined;

  const altText = await getDailyPuzzleAltText();
  const imageData = await getDailyPuzzleScreenshot();
  const postText = new RichText({ text: getPostText() });
  await postText.detectFacets(agent);

  console.log("Posting puzzle...");
  console.log(`Alt Text: ${altText}`);
  console.log(`Post Text: ${postText}`);

  const loginResult = await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });

  if (!loginResult.success) {
    console.log("Login failed!");
    return;
  }

  const image = await agent.uploadBlob(imageData, {
    encoding: "image/png",
  });

  lastPostUri = await agent.post({
    text: postText.text,
    facets: postText.facets,
    embed: {
      $type: "app.bsky.embed.images",
      images: [
        {
          alt: altText,
          image: image.data.blob,
          aspectRatio: {
            // a hint to clients
            width: 800,
            height: 650,
          },
        },
      ],
    },
    createdAt: new Date().toISOString(),
  });
  console.log("Just posted!");
}

async function repostPuzzleInEvening() {
  await agent.login({
    identifier: process.env.BLUESKY_USERNAME!,
    password: process.env.BLUESKY_PASSWORD!,
  });
  if (lastPostUri) {
    await agent.repost(lastPostUri.uri, lastPostUri.cid);
    console.log("Just reposted!");
  }
}

const amPostSchedule = "0 8 * * *"; // Run once every day at 8 AM ET
const pmRepostSchedule = "0 18 * * *"; // Run once every day at 6 PM ET
//const debugSchedule = "* */1 * * *"; // Runs every minute, for debugging purposes

const postJob = new CronJob(amPostSchedule, postPuzzleInAM);
const repostJob = new CronJob(pmRepostSchedule, repostPuzzleInEvening);

postPuzzleInAM();

postJob.start();
repostJob.start();

console.log(`Started Magic: The Griddening Puzzle Poster in ${process.env.NODE_ENV} mode!`);
