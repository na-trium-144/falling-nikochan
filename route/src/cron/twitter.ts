import { TwitterApi } from "twitter-api-v2";
import { Bindings } from "../env.js";
import twitterText from "twitter-text";
import { ChartBrief } from "@falling-nikochan/chart";
import { checkTextSafety } from "./gemini.js";
import { reportToDiscord } from "./discord.js";

function newTwitterClient(env: Bindings) {
  return new TwitterApi({
    appKey: env.TWITTER_API_KEY!,
    appSecret: env.TWITTER_API_KEY_SECRET!,
    accessToken: env.TWITTER_ACCESS_TOKEN!,
    accessSecret: env.TWITTER_ACCESS_TOKEN_SECRET!,
  }).readWrite;
}

export async function postChart(
  env: Bindings,
  cid: string,
  brief: ChartBrief,
  postType: "new" | "update"
): Promise<"ok" | "error" | "skipped"> {
  const client = newTwitterClient(env);
  const messageHeader =
    postType === "new"
      ? `#fallingnikochan 新しい譜面が公開されました!\n`
      : `#fallingnikochan 譜面が更新されました!\n`;
  const messageID = `ID: ${cid}\n`;
  let messageAboutSong = `${brief.title} / ${brief.composer}`;
  const messageAboutLevel =
    brief.levels
      .slice(0, 3)
      .map((lv) => `${lv.type}-${lv.difficulty}`)
      .join(", ") + (brief.levels.length > 3 ? ",…" : "");
  const messageFooter = "\n\n誰でもこのURLから遊べます: ";
  const messageURL = `https://nikochan.utcode.net/share/${cid}`;
  const messageJoined = () =>
    [
      messageHeader,
      messageID,
      messageAboutSong,
      "\n",
      messageAboutLevel,
      messageFooter,
      messageURL,
    ].join("");
  while (twitterText.parseTweet(messageJoined()).weightedLength > 280) {
    messageAboutSong = messageAboutSong.slice(0, -2) + "…";
  }
  try {
    if (
      twitterText.extractUrls(brief.title).length > 0 ||
      twitterText.extractUrls(brief.composer).length > 0
    ) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to URL in song title or composer.\n\n" +
          "Original message:\n" +
          messageJoined()
      );
      return "skipped";
    }
    if (!(await checkTextSafety(env, messageJoined()))) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to unsafe content detected by Gemini.\n\n" +
          "Original message:\n" +
          messageJoined()
      );
      return "skipped";
    }

    await client.v2.tweet(messageJoined());
    return "ok";
  } catch (e) {
    if (String(e).includes("duplicate")) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to duplicate tweet error.\n\n" +
          "Original message:\n" +
          messageJoined()
      );
      return "skipped";
    }
    await reportToDiscord(
      env,
      "Error trying to post tweet:\n" +
        String(e) +
        "\n\nOriginal message:\n" +
        messageJoined()
    );
    return "error";
  }
}

export async function postPopular(
  env: Bindings,
  briefs: ChartBrief[]
): Promise<"ok" | "error" | "skipped"> {
  const client = newTwitterClient(env);
  const messageHeader = `#fallingnikochan 人気の譜面ランキング\n\n`;
  const maxEntryLen = Math.floor(
    (280 - twitterText.parseTweet(messageHeader).weightedLength) / briefs.length
  );
  const messageEntries: string[] = [];
  for (const [index, brief] of briefs.entries()) {
    let line = `${index + 1}. ${brief.title} / ${brief.composer}\n`;
    while (twitterText.parseTweet(line).weightedLength > maxEntryLen) {
      line = line.slice(0, -3) + "…\n";
    }
    messageEntries.push(line);
  }
  try {
    if (
      messageEntries.some((entry) => twitterText.extractUrls(entry).length > 0)
    ) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to URL in song title or composer.\n\n" +
          "Original message:\n" +
          messageHeader +
          messageEntries.join("")
      );
      return "skipped";
    }
    if (
      !(await checkTextSafety(env, messageHeader + messageEntries.join("")))
    ) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to unsafe content detected by Gemini.\n\n" +
          "Original message:\n" +
          messageHeader +
          messageEntries.join("")
      );
      return "skipped";
    }

    await client.v2.tweet(messageHeader + messageEntries.join(""));
    return "ok";
  } catch (e) {
    if (String(e).includes("duplicate")) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to duplicate tweet error.\n\n" +
          "Original message:\n" +
          messageHeader +
          messageEntries.join("")
      );
      return "skipped";
    }
    await reportToDiscord(
      env,
      "Error trying to post popular charts tweet:\n" +
        String(e) +
        "\n\nOriginal message:\n" +
        messageHeader +
        messageEntries.join("")
    );
    return "error";
  }
}
