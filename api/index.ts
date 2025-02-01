// ファイル名が api/index.ts でないとvercelは認識してくれない
// すべてのimportの拡張子に .js がついていないとvercelは認識してくれない

import "dotenv/config";
import { handle } from "hono/vercel";
import app from "../route/app.js";

// export const config = {
//   runtime: "nodejs",
// };

export default handle(app);
