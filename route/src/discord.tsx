/** @jsx jsx */
/** @jsxImportSource hono/jsx */

import { Hono } from "hono";
import { backendOrigin, Bindings, cacheControl } from "./env.js";
import { isbot } from "isbot";
import { discordInvite, SOCIAL_CACHE_MAX_AGE } from "./api/social.js";
import { env } from "hono/adapter";
import { parse } from "node-html-parser";

// import of jsx is needed when executing this file using tsx (pnpm run ldev)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsx } from "hono/jsx";

const discordInviteApp = new Hono<{ Bindings: Bindings }>({
  strict: false,
}).get("/", async (c) => {
  // botに対してはOGプレビューを返し、ブラウザに対してはリダイレクトを返す
  if (isbot(c.req.header("User-Agent"))) {
    const lang = c.req.query("lang") || "en";
    const discordLocale =
      {
        // nikochan locale -> discord locale
        ja: "ja",
        en: "en-US",
      }[lang] ?? lang;
    const originalRes = await fetch(
      `https://discord.gg/${discordInvite}?locale=${discordLocale}`
    );
    const originalHtml = parse(await originalRes.text());
    const copyMetaByName = (name: string) => (
      <meta
        name={name}
        content={originalHtml
          .querySelector(`meta[name="${name}"]`)
          ?.getAttribute("content")}
      />
    );
    const copyMetaByProperty = (name: string) => (
      <meta
        property={name}
        content={originalHtml
          .querySelector(`meta[property="${name}"]`)
          ?.getAttribute("content")}
      />
    );
    return c.html(
      <html>
        <head>
          <meta charset="utf-8" />
          <title>{originalHtml.querySelector("title")?.textContent}</title>
          {copyMetaByName("description")}
          {copyMetaByName("twitter:card")}
          {copyMetaByName("twitter:site")}
          {copyMetaByName("twitter:title")}
          {copyMetaByName("twitter:description")}
          {copyMetaByProperty("og:title")}
          {copyMetaByProperty("og:description")}
          {copyMetaByProperty("og:site_name")}
          <meta
            name="twitter:image"
            content={new URL(
              "/og/discord" + new URL(c.req.url).search,
              backendOrigin(c)
            ).toString()}
          />
          <meta
            property="og:image"
            content={new URL(
              "/og/discord" + new URL(c.req.url).search,
              backendOrigin(c)
            ).toString()}
          />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:url"
            content={new URL("/discord", backendOrigin(c)).toString()}
          />
          <link
            rel="canonical"
            href={new URL("/discord", backendOrigin(c)).toString()}
          />
          <meta name="robots" content="noindex, nofollow, nocache" />
          <link
            rel="icon"
            href={new URL(
              originalHtml
                .querySelector(`link[rel="icon"]`)
                ?.getAttribute("href") ?? "/assets/favicon.ico", // これを書いた時点では /assets/favicon.ico だった
              "https://discord.gg"
            ).toString()}
          />
        </head>
        <body>
          <h1>
            {originalHtml
              .querySelector(`meta[property="og:title"]`)
              ?.getAttribute("content")}
          </h1>
          <p>
            Click <a href={`https://discord.gg/${discordInvite}`}>here</a> if
            you are not automatically redirected.
          </p>
        </body>
      </html>,
      200,
      {
        "Cache-Control": cacheControl(env(c), SOCIAL_CACHE_MAX_AGE),
      }
    );
  }
  return c.redirect(`https://discord.gg/${discordInvite}`, 302);
});

export default discordInviteApp;
