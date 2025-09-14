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
