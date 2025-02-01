import { handle } from "hono/vercel";
import app from "../app";
import "dotenv/config";

export const config = {
  runtime: "nodejs",
};

export default handle(app);
