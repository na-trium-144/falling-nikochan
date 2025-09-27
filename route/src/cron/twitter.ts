import { Bindings } from "../env.js";
import twitterText from "twitter-text";
import { ChartBrief } from "@falling-nikochan/chart";
import { checkTextSafety } from "./gemini.js";
import { reportToDiscord } from "./discord.js";
import OAuth from "oauth-1.0a";
import crypto from "crypto";

async function tweet(env: Bindings, content: string) {
  // https://www.leopradel.com/blog/use-twitter-api-clouflare-worker
  // https://zenn.dev/maretol/articles/163d2b82c9bb2d

  const oauth = new OAuth({
    consumer: {
      key: env.TWITTER_API_KEY!,
      secret: env.TWITTER_API_KEY_SECRET!,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const oauthToken = {
    key: env.TWITTER_ACCESS_TOKEN!,
    secret: env.TWITTER_ACCESS_TOKEN_SECRET!,
  };

  const requestData = {
    // url: "https://api.twitter.com/1.1/statuses/update.json",
    url: "https://api.x.com/2/tweets",
    method: "POST",
    // data: { status: content },
  };

  const response = await fetch(requestData.url, {
    method: requestData.method,
    headers: {
      ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
      // "Content-Type": "application/x-www-form-urlencoded",
      "Content-Type": "application/json",
    },
    // body: new URLSearchParams(requestData.data),
    body: JSON.stringify({ text: content }),
  });
  if (!response.ok) {
    throw new Error(
      `X API returned ${response.status}: ${await response.text()}`
    );
  }
}

export async function postChart(
  env: Bindings,
  cid: string,
  brief: ChartBrief,
  postType: "new" | "update"
): Promise<"ok" | "error" | "skipped"> {
  let messageAboutSong = `${brief.title} / ${brief.composer}`;
  const messageAboutLevel =
    brief.levels
      .slice(0, 3)
      .map((lv) => `${lv.type}-${lv.difficulty}`)
      .join(", ") + (brief.levels.length > 3 ? ",…" : "");
  const messageJoined = () =>
    [
      postType === "new"
        ? `#fallingnikochan 新しい譜面が公開されました!`
        : `#fallingnikochan 譜面が更新されました!`,
      ` (${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${new Date().getUTCDate()})\n`,
      `誰でもこのURLから遊べます: https://nikochan.utcode.net/share/${cid}\n\n`,
      // `ID: ${cid}\n`,
      messageAboutSong + "\n",
      messageAboutLevel,
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

    await tweet(env, messageJoined());
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
  const messageHeader =
    `アクセス数の多い譜面ランキング ` +
    `${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${new Date().getUTCDate()}\n\n`;
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

    await tweet(env, messageHeader + messageEntries.join(""));
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
