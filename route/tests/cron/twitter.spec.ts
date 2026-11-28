import { describe, test } from "node:test";
import { expect } from "chai";
import twitterText from "twitter-text";
import {
  escapeDiscordText,
  truncateToTweetLimit,
} from "@falling-nikochan/route/src/cron/twitter";

describe("cron/twitter", () => {
  test("escapeDiscordText should escape masked markdown links and mentions", () => {
    const escaped = escapeDiscordText(
      "Song [click here](https://evil.example) @everyone"
    );
    expect(escaped).to.include("\\[click here](https://evil.example)");
    expect(escaped).to.not.include("@everyone");
    expect(escaped).to.include("＠everyone");
  });

  test("truncateToTweetLimit should truncate very long titles quickly", () => {
    const longTitle = "あ".repeat(100_000);
    const start = performance.now();
    const truncated = truncateToTweetLimit(
      longTitle,
      280,
      (s) => `prefix ${s} suffix`
    );
    const elapsedMs = performance.now() - start;

    expect(
      twitterText.parseTweet(`prefix ${truncated} suffix`).weightedLength
    ).to.be.at.most(280);
    expect(truncated.endsWith("…")).to.equal(true);
    expect(elapsedMs).to.be.below(1000);
  });
});
