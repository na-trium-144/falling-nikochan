import { Hono } from "hono";
import { cache } from "hono/cache";
import { Db } from "mongodb";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { fetchError } from "../error.js";
import { BaseLogger } from "@hono/structured-logger";

export const SOCIAL_CACHE_MAX_AGE = 3600;

export const discordInvite = "BGQ6Vk9maA";
const channelId = "UChAEFwUtjsbWmWwZSxYLXWQ";

export async function discordMembers(e: Bindings) {
  const apiRes = await fetch(
    `https://discord.com/api/v10/invites/${discordInvite}?with_counts=true`
  ).catch(fetchError(e));
  const data: any = await apiRes.json();
  return {
    invite: discordInvite,
    member: data.approximate_member_count as number,
    online: data.approximate_presence_count as number,
  };
}

async function youtubeSubscribers(logger: BaseLogger, e: Bindings) {
  if (!e.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY not set");
  }
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?" +
      new URLSearchParams({
        part: "statistics",
        id: channelId,
        key: e.YOUTUBE_API_KEY,
      })
  ).catch(fetchError(e));
  const data: any = await res.json();
  logger.info({ ytData: data });
  return { subscribers: data.items[0]?.statistics?.subscriberCount as number };
}

const socialApp = new Hono<{
  Bindings: Bindings;
  Variables: { logger: BaseLogger; db: () => Promise<Db> };
}>({
  strict: false,
}).get(
  "/",
  cache({
    cacheName: "api-social",
  }),
  async (c) => {
    const [discord, youtube] = await Promise.all([
      discordMembers(env(c)),
      youtubeSubscribers(c.var.logger, env(c)),
    ]);
    return c.json({ discord, youtube }, 200, {
      "cache-control": cacheControl(env(c), SOCIAL_CACHE_MAX_AGE),
    });
  }
);

export default socialApp;
