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
  async fetch(request: Request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.match(/^\/api\/brief\/[0-9]+$/)) {
      const cid: string = url.pathname.split("/").pop()!;
      const includeLevels: boolean = !!Number(url.searchParams.get("levels"));
      return await handleGetBrief(cid, includeLevels);
    }
    if (url.pathname.match(/^\/api\/chartFile\/[0-9]+$/)) {
      const cid: string = url.pathname.split("/").pop()!;
      const passwdHash = new URL(request.url).searchParams.get("p");
      if (request.method === "GET") {
        return await handleGetChartFile(cid, passwdHash);
      } else if (request.method === "POST") {
        return await handlePostChartFile(
          cid,
          passwdHash,
          await request.arrayBuffer()
        );
      } else if (request.method === "DELETE") {
        return await handleDeleteChartFile(cid, passwdHash);
      }
    }
    if (url.pathname.match(/^\/api\/newChartFile$/)) {
      if (request.method === "GET") {
        return await handleGetNewChartFile(request.headers);
      } else if (request.method === "POST") {
        return await handlePostNewChartFile(
          request.headers,
          await request.arrayBuffer()
        );
      }
    }
    if (url.pathname.match(/^\/api\/seqFile\/[0-9]+\/[0-9]+/)) {
      const [cid, lvIndex] = url.pathname.split("/").slice(-2);
      return await handleGetSeqFile(cid, Number(lvIndex));
    }
    if (url.pathname.match(/^\/api\/latest$/)) {
      return await handleGetLatest();
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
