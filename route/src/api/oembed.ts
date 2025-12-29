import { ExecutionContext, Hono } from "hono";
import { cache } from "hono/cache";
import { Bindings, cacheControl } from "../env.js";
import { env } from "hono/adapter";
import { ChartBrief } from "@falling-nikochan/chart";
import * as v from "valibot";
import { describeRoute, resolver, validator } from "hono-openapi";
import { errorLiteral } from "../error.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import xmlbuilder2 from "xmlbuilder2";

// Cache duration for this API endpoint (in seconds)
const CACHE_MAX_AGE = 600;

const OEmbedSchema = () =>
  v.object({
    type: v.string(),
    version: v.literal("1.0"),
    title: v.string(),
    author_name: v.optional(v.string()),
    author_url: v.optional(v.string()),
    provider_name: v.optional(v.string()),
    provider_url: v.optional(v.string()),
    cache_age: v.optional(v.number()),
    thumbnail_url: v.optional(v.string()),
    thumbnail_width: v.optional(v.number()),
    thumbnail_height: v.optional(v.number()),
    // rich type
    html: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  });
const OEmbedParamSchema = () =>
  v.object({
    url: v.string(),
    maxwidth: v.optional(v.pipe(v.string(), v.toNumber())),
    maxheight: v.optional(v.pipe(v.string(), v.toNumber())),
    format: v.optional(v.union([v.literal("json"), v.literal("xml")])),
  });

const oembedApp = async (config: {
  fetchBrief: (
    e: Bindings,
    cid: string,
    ctx: ExecutionContext | undefined
  ) => Response | Promise<Response>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false }).get(
    "/",
    cache({
      cacheName: "api-oembed",
      cacheControl: `max-age=${CACHE_MAX_AGE}`,
    }),
    describeRoute({
      description:
        "Get oEmbed information about the chart according to oEmbed spec: https://oembed.com/",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(OEmbedSchema()),
            },
            "text/xml": {
              schema: resolver(OEmbedSchema()),
            },
          },
        },
        404: {
          description: "Chart not found or invalid url",
          content: {
            "application/json": {
              schema: resolver(
                await errorLiteral("notFound", "chartIdNotFound")
              ),
            },
          },
        },
      },
    }),
    validator("query", OEmbedParamSchema()),
    async (c) => {
      const {
        url: embedUrl,
        maxwidth,
        maxheight,
        format: resFormat,
      } = c.req.valid("query");
      const match = new URL(embedUrl).pathname.match(
        /^\/(?:embed|share)\/([0-9]+)$/
      );
      const cid = match ? match[1] : null;
      if (!cid) {
        return c.json({ message: "notFound" }, 404);
      }

      const t = await getTranslations("en", "share");

      let executionCtx: ExecutionContext | undefined = undefined;
      try {
        executionCtx = c.executionCtx;
      } catch {
        //ignore
      }
      const briefRes = await config.fetchBrief(env(c), cid, executionCtx);
      if (!briefRes.ok) {
        return briefRes;
      }
      const brief = (await briefRes.json()) as ChartBrief;

      const iframeURL = new URL(
        `/share/${cid}`,
        new URL(env(c).BACKEND_PREFIX || c.req.url).origin
      );
      const width = Math.round(maxwidth || 640);
      const height = Math.round(
        maxheight
          ? Math.min(maxheight, ((maxwidth || Infinity) / 4) * 3)
          : (width / 4) * 3
      );
      const oembed: v.InferOutput<ReturnType<typeof OEmbedSchema>> = {
        type: "rich",
        version: "1.0",
        title: brief.composer
          ? t("titleWithComposer", {
              title: brief.title,
              composer: brief.composer,
              cid: cid,
            })
          : t("title", {
              title: brief.title,
              cid: cid,
            }),
        author_name: brief.chartCreator,
        provider_name: "Falling Nikochan",
        provider_url: new URL(env(c).BACKEND_PREFIX || c.req.url).origin,
        cache_age: CACHE_MAX_AGE,
        html: `<iframe width="${width}" height="${height}" src="${iframeURL}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe>`,
        width,
        height,
      };

      switch (resFormat) {
        case "json":
        case undefined:
          return c.json(oembed, 200, {
            "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
          });
        case "xml":
          return c.body(
            xmlbuilder2.create({ oembed }).end({ prettyPrint: true }),
            200,
            {
              "Content-Type": "text/xml",
              "cache-control": cacheControl(env(c), CACHE_MAX_AGE),
            }
          );
        default:
          resFormat satisfies never;
          return c.body(null, 400);
      }
    }
  );

export default oembedApp;
