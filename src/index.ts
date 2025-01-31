/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { handleGetBrief } from "./brief";
import {
  handleDeleteChartFile,
  handleGetChartFile,
  handlePostChartFile,
} from "./chartFile";
import { handleGetLatest } from "./latest";
import { handleGetNewChartFile, handlePostNewChartFile } from "./newChartFile";
import { handleGetSeqFile } from "./seqFile";

export default {
  async fetch(request: Request, env: Env, ctx): Promise<Response> {
    const url = new URL(request.url);
    let res: Response = new Response(null, { status: 404 });
    if (url.pathname.match(/^\/api\/brief\/[0-9]+$/)) {
      const cid: string = url.pathname.split("/").pop()!;
      const includeLevels: boolean = !!Number(url.searchParams.get("levels"));
      res = await handleGetBrief(env, cid, includeLevels);
      if (res.ok) {
        res.headers.set("Cache-Control", "max-age=3600");
      }
    } else if (url.pathname.match(/^\/api\/latest$/)) {
      res = await handleGetLatest(env);
      if (res.ok) {
        res.headers.set("Cache-Control", "max-age=3600");
      }
    } else if (url.pathname.match(/^\/api\/chartFile\/[0-9]+$/)) {
      const cid: string = url.pathname.split("/").pop()!;
      const passwdHash = new URL(request.url).searchParams.get("p");
      if (request.method === "GET") {
        res = await handleGetChartFile(env, cid, passwdHash);
      } else if (request.method === "POST") {
        res = await handlePostChartFile(
          env,
          cid,
          passwdHash,
          await request.arrayBuffer()
        );
      } else if (request.method === "DELETE") {
        res = await handleDeleteChartFile(env, cid, passwdHash);
      }
    } else if (url.pathname.match(/^\/api\/newChartFile$/)) {
      if (request.method === "GET") {
        res = await handleGetNewChartFile(env, request.headers);
      } else if (request.method === "POST") {
        res = await handlePostNewChartFile(
          env,
          request.headers,
          await request.arrayBuffer()
        );
      }
    } else if (url.pathname.match(/^\/api\/seqFile\/[0-9]+\/[0-9]+/)) {
      const [cid, lvIndex] = url.pathname.split("/").slice(-2);
      res = await handleGetSeqFile(env, cid, Number(lvIndex));
    }
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  },
} satisfies ExportedHandler<Env>;
