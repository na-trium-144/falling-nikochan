import { locales } from "@falling-nikochan/i18n/dynamic.js";
import { languageDetector as honoLanguageDetector } from "hono/language";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import briefApp from "./api/brief.js";
import { Context, ExecutionContext, Hono, MiddlewareHandler } from "hono";
import { fetchError, onError } from "./error.js";
import { env } from "hono/adapter";
import type { captureException } from "@sentry/hono/node";
import type { ChartBrief } from "@falling-nikochan/chart";

export interface Bindings {
  ASSETS?: { fetch: typeof fetch };
  MONGODB_URI: string;
  API_ENV?: "development";
  API_NO_RATELIMIT?: "1";
  SECRET_SALT?: string;
  API_CACHE_EDGE?: "1";
  ASSET_PREFIX?: string;
  BACKEND_PREFIX?: string;
  BACKEND_OG_PREFIX?: string;
  VERCEL_PROTECTION_BYPASS_SECRET?: string;
  YOUTUBE_API_KEY?: string;
  TWITTER_API_KEY?: string;
  TWITTER_API_KEY_SECRET?: string;
  TWITTER_ACCESS_TOKEN?: string;
  TWITTER_ACCESS_TOKEN_SECRET?: string;
  GEMINI_API_KEY?: string;
  DISCORD_WEBHOOK_ID?: string;
  DISCORD_WEBHOOK_TOKEN?: string;
  IS_SERVICE_WORKER?: string;
}

export function secretSalt(e: Bindings) {
  if (e.SECRET_SALT) {
    return e.SECRET_SALT!;
  } else if (e.API_ENV === "development") {
    return "SecretSalt";
  } else {
    throw new Error("SECRET_SALT not set in production environment!");
  }
}

export function cacheControl(e: Bindings, age: number | null) {
  if (age) {
    if (e.API_CACHE_EDGE) {
      return `max-age=${age}, s-maxage=${age}`;
    } else {
      return `max-age=${age}`;
    }
  } else {
    return "no-store";
  }
}

export function backendOrigin(c: Context<{ Bindings: Bindings }>): string {
  if (env(c).BACKEND_PREFIX) {
    return env(c).BACKEND_PREFIX!;
  } else {
    const url = new URL(c.req.url);
    if (c.req.header("x-forwarded-proto")) {
      url.protocol = c.req.header("x-forwarded-proto")!;
    }
    return url.origin;
  }
}
/**
 * src/api/brief.ts を用いてbriefデータを取得。
 * ネットワークエラー時HTTPException(502), エラーレスポンス時Responseをthrowする
 */
export const fetchBrief =
  (config: {
    fetchStatic: (e: Bindings, url: URL) => Response | Promise<Response>;
    sentry: ((app: Hono<{ Bindings: Bindings }>) => MiddlewareHandler) | null;
    captureException: typeof captureException;
  }) =>
  async (e: Bindings, cid: string, ctx: ExecutionContext | undefined) => {
    const app = new Hono<{ Bindings: Bindings }>({ strict: false });
    if (config.sentry) {
      app.use(config.sentry(app));
    }
    app.route("/api/brief", briefApp).onError(
      onError({
        fetchStatic: config.fetchStatic,
        captureException: config.captureException,
      })
    );
    const res = await Promise.resolve(
      app.request(`/api/brief/${cid}`, undefined, e, ctx)
    ).catch(fetchError(e));
    if (res.ok) {
      return (await res.json()) as ChartBrief;
    } else {
      throw res;
    }
  };
/**
 * URLをfetch()してリソースを取得。
 * ネットワークエラー時HTTPException(502), エラーレスポンス時Responseをthrowする
 */
export async function fetchStatic(e: Bindings, url: URL) {
  const res = await fetch(new URL(url.pathname, e.ASSET_PREFIX || url.origin), {
    headers: {
      // https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
      // same as VERCEL_AUTOMATION_BYPASS_SECRET but manually set for preview env only
      ...(e.VERCEL_PROTECTION_BYPASS_SECRET
        ? {
            "x-vercel-protection-bypass": e.VERCEL_PROTECTION_BYPASS_SECRET,
          }
        : {}),
    },
  }).catch(fetchError(e));
  if (res.ok) {
    return res;
  } else {
    throw res;
  }
}

export function languageDetector() {
  if (dotenv && join && dirname) {
    dotenv.config({ path: join(dirname(process.cwd()), ".env") });
  }
  return honoLanguageDetector({
    convertDetectedLanguage: (lang) => lang.split("-")[0],
    supportedLanguages: locales,
    fallbackLanguage: "en",
    order: ["cookie", "header"],
    lookupCookie: "language",
    cookieOptions: {
      sameSite: "Lax",
      secure: process.env.API_ENV !== "development",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
    },
    // debug: process.env.API_ENV === "development",
  });
}
