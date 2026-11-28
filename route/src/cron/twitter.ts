import { Bindings } from "../env.js";
import twitterText from "twitter-text";
import { ChartBrief } from "@falling-nikochan/chart";
// import { checkTextSafety } from "./gemini.js";
import { reportToDiscord, announceToDiscord } from "./discord.js";
import { escapeMarkdown } from "discord.js";
// import OAuth from "oauth-1.0a";
// import crypto from "crypto";

export function escapeDiscordText(text: string): string {
  return escapeMarkdown(text, { maskedLink: true }).replaceAll("@", "＠");
}

export function truncateToTweetLimit(
  text: string,
  maxWeightedLength: number,
  buildTweet: (candidate: string) => string
): string {
  if (
    twitterText.parseTweet(buildTweet(text)).weightedLength <= maxWeightedLength
  ) {
    return text;
  }
  const chars = Array.from(text);
  let lo = 0;
  let hi = chars.length - 1;
  let best = "";
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = chars.slice(0, mid).join("") + "…";
    if (
      twitterText.parseTweet(buildTweet(candidate)).weightedLength <=
      maxWeightedLength
    ) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/*
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
*/

export async function postChart(
  env: Bindings,
  cid: string,
  brief: ChartBrief,
  postType: "new" | "update"
): Promise<"ok" | "error" | "skipped"> {
  const messageAboutSong = `${brief.title} / ${brief.composer}`;
  const messageAboutLevel =
    brief.levels
      .slice(0, 3)
      .filter((lv) => !lv.unlisted)
      .map((lv) => `${lv.type}-${lv.difficulty}`)
      .join(", ") + (brief.levels.length > 3 ? ",…" : "");

  const messageForDiscord = [
    postType === "new"
      ? `新しい譜面が公開されました!`
      : `譜面が更新されました!`,
    "\n",
    `https://nikochan.utcode.net/share/${cid}\n\n`,
    // `ID: ${cid}\n`,
    escapeDiscordText(messageAboutSong) + "\n",
    escapeDiscordText(messageAboutLevel),
  ].join("");
  await announceToDiscord(env, messageForDiscord);

  const messageJoined = (song: string) =>
    [
      postType === "new"
        ? `新しい譜面が公開されました!`
        : `譜面が更新されました!`,
      ` (${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${new Date().getUTCDate()})\n`,
      `誰でもこのURLから遊べます: https://nikochan.utcode.net/share/${cid}\n\n`,
      // `ID: ${cid}\n`,
      song + "\n\n",
      // messageAboutLevel,
      "#fallingnikochan #リズムゲーム #音ゲー",
    ]
      .join("")
      .replaceAll("@", "＠");
  const message = messageJoined(
    truncateToTweetLimit(messageAboutSong, 280, messageJoined)
  );
  const escapedMessage = escapeDiscordText(message);

  try {
    if (
      twitterText.extractUrls(brief.title).length > 0 ||
      twitterText.extractUrls(brief.composer).length > 0
    ) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to URL in song title or composer.\n\n" +
          "Original message:\n" +
          escapedMessage
      );
      return "skipped";
    }
    /*
    const safetyReason = await checkTextSafety(env, message);
    if (safetyReason !== null) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to unsafe content detected by Gemini.\n\n" +
          "Reason:\n" +
          safetyReason +
          "\n\nOriginal message:\n" +
          message
      );
      return "skipped";
    }
    */

    // await tweet(env, message);
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    const adminMessage = `以下のメッセージをポストしてください: ${intentUrl}\noriginal message:\n${escapedMessage}`;
    await reportToDiscord(env, adminMessage);

    return "ok";
  } catch (e) {
    if (String(e).includes("duplicate")) {
      await reportToDiscord(
        env,
        "Skipped posting tweet due to duplicate tweet error.\n\n" +
          "Original message:\n" +
          escapedMessage
      );
      return "skipped";
    }
    await reportToDiscord(
      env,
      "Error trying to post tweet:\n" +
        String(e) +
        "\n\nOriginal message:\n" +
        escapedMessage
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
    const line = `${index + 1}. ${brief.title} / ${brief.composer}`;
    const truncated = truncateToTweetLimit(
      line,
      maxEntryLen,
      (candidate) => `${candidate}\n`
    );
    messageEntries.push(`${truncated}\n`.replaceAll("@", "＠"));
  }
  const message = messageHeader + messageEntries.join("");
  const escapedMessage = escapeDiscordText(message);
  try {
    if (
      messageEntries.some((entry) => twitterText.extractUrls(entry).length > 0)
    ) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to URL in song title or composer.\n\n" +
          "Original message:\n" +
          escapedMessage
      );
      return "skipped";
    }
    /*
    const safetyReason = await checkTextSafety(env, message);
    if (safetyReason !== null) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to unsafe content detected by Gemini.\n\n" +
          "Reason:\n" +
          safetyReason +
          "\n\nOriginal message:\n" +
          message
      );
      return "skipped";
    }
    */

    // await tweet(env, message);
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    const adminMessage = `以下のメッセージをポストしてください: ${intentUrl}\noriginal message:\n${escapedMessage}`;
    await reportToDiscord(env, adminMessage);
    return "ok";
  } catch (e) {
    if (String(e).includes("duplicate")) {
      await reportToDiscord(
        env,
        "Skipped posting popular charts tweet due to duplicate tweet error.\n\n" +
          "Original message:\n" +
          escapedMessage
      );
      return "skipped";
    }
    await reportToDiscord(
      env,
      "Error trying to post popular charts tweet:\n" +
        String(e) +
        "\n\nOriginal message:\n" +
        escapedMessage
    );
    return "error";
  }
}
