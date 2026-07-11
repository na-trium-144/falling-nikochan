import { WebhookClient } from "discord.js";
import { Bindings } from "../env.js";

export async function reportToDiscord(env: Bindings, message: string) {
  try {
    const webhook = new WebhookClient({
      id: env.DISCORD_WEBHOOK_ID!,
      token: env.DISCORD_WEBHOOK_TOKEN!,
    });
    await webhook.send({
      content: message,
    });
    console.log("Reported to Discord.");
  } catch (e) {
    console.error("Failed to report to Discord:", e);
    console.error("Original message:", message);
  }
}

export async function announceToDiscord(env: Bindings, message: string) {
  try {
    if (
      !env.DISCORD_ANNOUNCE_WEBHOOK_ID ||
      !env.DISCORD_ANNOUNCE_WEBHOOK_TOKEN
    ) {
      console.warn(
        "DISCORD_ANNOUNCE_WEBHOOK_ID or DISCORD_ANNOUNCE_WEBHOOK_TOKEN is not set."
      );
      return;
    }
    const webhook = new WebhookClient({
      id: env.DISCORD_ANNOUNCE_WEBHOOK_ID,
      token: env.DISCORD_ANNOUNCE_WEBHOOK_TOKEN,
    });
    await webhook.send({
      content: message,
    });
    console.log("Announced to Discord.");
  } catch (e) {
    console.error("Failed to announce to Discord:", e);
    console.error("Original message:", message);
  }
}
