// ファイル名が api/index.ts でないとvercelは認識してくれない
// すべてのimportの拡張子に .js がついていないとvercelは認識してくれない
// Set NODEJS_HELPERS=0 in Vercel production environment variables. https://github.com/honojs/hono/issues/1256

import { handle } from "hono/vercel";
import app from "@falling-nikochan/route";

// export const config = {
//   runtime: "nodejs",
// };

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
