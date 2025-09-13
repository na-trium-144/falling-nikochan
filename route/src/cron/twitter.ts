import { TwitterApi } from "twitter-api-v2";
import { Bindings } from "../env.js";
import { Db } from "mongodb";
import { entryToBrief, getChartEntry } from "../api/chart.js";
import { parseTweet } from "twitter-text";
import { ChartBrief } from "@falling-nikochan/chart";

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
) {
  const client = newTwitterClient(env);
  const messageHeader =
    postType === "new"
      ? `#fallingnikochan 新しい譜面が公開されました!\n`
      : `#fallingnikochan 譜面が更新されました!\n`;
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
      messageAboutSong,
      "\n",
      messageAboutLevel,
      messageFooter,
      messageURL,
    ].join("");
  if (parseTweet(messageJoined()).weightedLength > 280) {
    messageAboutSong += "…";
    while (parseTweet(messageJoined()).weightedLength > 280) {
      messageAboutSong = messageAboutSong.slice(0, -2) + "…";
    }
  }
  console.log(messageJoined());
  await client.v2.tweet(messageJoined());
}
