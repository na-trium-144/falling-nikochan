import "dotenv/config";
import { handle } from "hono/vercel";
import app from "../app";

export const config = {
  runtime: "nodejs",
};

export default handle(app);
