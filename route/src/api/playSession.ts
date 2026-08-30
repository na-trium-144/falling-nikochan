import { Hono } from "hono";
import { Bindings, ResponseOK, resultSecretPubKey } from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";

const playSessionApp = async (config: {
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .post(
      "/init",
      describeRoute({
        description:
          "Authentication flow for chart result verification:\n" +
          "1. Secret key ResultSecret is configured in server; public key is exposed via GET /api/playSession/publicKey.\n" +
          // 1 at route/src/env.ts, route/generateKeyPair.ts
          "2. Build generates ephemeral ResultBuildKey pair; private key in frontend env, public key at /resultBuildKey.json.\n" +
          // 2 at frontend/initAssets.js
        // "3. Client generates ephemeral SessionKey pair at /[locale]/play, " +
        // "signs SessionKey public key as a JWT with BuildKey, and sends it to POST /api/playSession." +
        // "4. Server verifies the JWT with BuildKey, signs the SessionKey public key as a JWT with ResultSecret, and returns it." +
        // "5. Client sends POST /api/record with Authorization: Bearer <token>, result serialized data, sign (result msgpack signed with SessionKey), and other metadata." +
        // "6. Server verifies the token with ResultSecret, verifies sign with SessionKey, verifies timestamp, and returns ResultSecret signature of result (skipped for auto play)." +
        // "7. Client saves and shares ResultParam with ResultSecret signature." +
        // "8. /og/result, /share, and /[locale]/share/placeholder verify ResultParam with ResultSecret public key.",
          "",
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
      async (c) => {}
    )
    .get(
      "/publicKey",
      describeRoute({
        description:
          "Get the public key for verifying result signatures as JWKs.",
        responses: {
          200: {
            description: "Successful response with ResultSecret public key",
            content: {
              "application/json": {
                schema: resolver(v.object({ keys: v.array(v.unknown()) })),
              },
            },
          },
        },
      }),
      async (c) => {
        return c.json(
          {
            keys: [
              await crypto.subtle.exportKey(
                "jwk",
                await resultSecretPubKey(env(c))
              ),
            ],
          },
          200,
          { "cache-control": "no-cache" }
        );
      }
    );

export default playSessionApp;
