import { Hono } from "hono";
import { Bindings } from "../env.js";

export interface PlayRecord {
  cid: string;
  lvHash: string;
  userId: string;
  playedAt: number;
  score: number;
}

const recordApp = new Hono<{ Bindings: Bindings }>({ strict: false })
  .get("/:cid", async (c) => {
    const cid = c.req.param("cid");
    // todo
    return c.body(null, 500);
  })
  .post("/:cid", async (c) => {
    const cid = c.req.param("cid");
    // todo
    return c.body(null, 500);
  });

export default recordApp;
