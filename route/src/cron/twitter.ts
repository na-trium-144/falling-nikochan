import { TwitterApi } from "twitter-api-v2";
import { Bindings } from "../env.js";
import { ChartBrief } from "@falling-nikochan/chart";

export async function postTwitter(
  env: Bindings,
  cid: string,
  brief: ChartBrief
) {
  const client = new TwitterApi({
    appKey: env.TWITTER_API_KEY!,
    appSecret: env.TWITTER_API_KEY_SECRET!,
    accessToken: env.TWITTER_ACCESS_TOKEN!,
    accessSecret: env.TWITTER_ACCESS_TOKEN_SECRET!,
  }).readWrite;

  const tweets = await client.v2.tweet(
    `#fallingnikochan 譜面が公開されました:\nhttps://nikochan.utcode.net/share/${cid}\n${brief.title} / ${brief.composer}`
  );
  console.log(tweets);
}
