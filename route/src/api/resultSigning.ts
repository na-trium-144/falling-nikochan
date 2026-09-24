import { Hono } from "hono";
import { Bindings, ResponseOK } from "../env.js";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

const resultSigningApp = async (config: {
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) => {
  void config;
  return new Hono<{ Bindings: Bindings }>({ strict: false }).post(
    "/init",
    describeRoute({
      description:
        "Authentication flow for chart result verification:\n" +
        "1. Secret key ResultSecret is configured in server.\n",
      // 1 at route/src/env.ts, route/generateSecretKey.ts
      // "2. Build generates ephemeral ResultBuildKey pair; private key in frontend env, public key at /resultBuildKey.json.\n" +
      // "3. Client generates ephemeral ResultSessionKey pair at /[locale]/play, " +
      // "signs ResultSessionKey public key and cid as a JWT with ResultBuildKey, " +
      // "and sends it to POST /api/resultSigning/init.\n" +
      // "4. Server verifies the JWT with BuildKey, signs the same payload (ResultSessionKey public key and cid) as a JWT with ResultSecret, and returns it.\n" +
      // "5. Client sends POST /api/record and POST /api/resultSigning/sign with `Authorization: Bearer <token>` and result data signed with ResultSessionKey.\n" +
      // "6. Server verifies the signature of token and record/result, verifies cid and timestamp, and stores the record anonymously / returns ResultSecret signature of result.\n" +
      // "7. Client saves and shares ResultParam with ResultSecret signature.\n" +
      // "8. /og/result, /share, and /[locale]/share/placeholder verify ResultParam with GET /api/resultSigning/verify.",
      responses: {
        200: {
          description: "Successful response with session token",
          content: {
            "application/jwt": {
              schema: resolver(v.string()),
            },
          },
        },
      },
    }),
    async () => {}
  );
};

export default resultSigningApp;
