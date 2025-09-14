import { TwitterApi } from "twitter-api-v2";
import { Bindings } from "../env.js";
import { extractUrls, parseTweet } from "twitter-text";
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
  while (parseTweet(messageJoined()).weightedLength > 280) {
    messageAboutSong = messageAboutSong.slice(0, -2) + "…";
  }
  try {
    if (
      extractUrls(brief.title).length > 0 ||
      extractUrls(brief.composer).length > 0
    ) {
      reportToDiscord(
        env,
        "Skipped posting tweet due to URL in song title or composer.\n\n" +
          "Original message:\n" +
          messageJoined()
      );
      return "skipped";
    }
    if (!(await checkTextSafety(env, messageJoined()))) {
      reportToDiscord(
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
    if(String(e).includes("duplicate")) {
      reportToDiscord(
        env,
        "Skipped posting tweet due to duplicate tweet error.\n\n" +
          "Original message:\n" +
          messageJoined()
      );
      return "skipped";
    }
    reportToDiscord(
      env,
      "Error trying to post tweet:\n" +
        String(e) +
        "\n\nOriginal message:\n" +
        messageJoined()
    );
    return "error";
  }
}
