import { Hono } from "hono";
import { backendOrigin, Bindings, fetchStatic, ResponseOK } from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import { sValidatorHook, validationErrorSchema } from "../error.js";
import { sign, verify } from "hono/jwt";
import * as v from "valibot";
import { JsonWebKey } from "crypto";
import { base64UrlToBytes } from "@falling-nikochan/chart";

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
          "3. Client generates ephemeral SessionKey pair at /[locale]/play, " +
          "signs SessionKey public key and cid as a JWT with ResultBuildKey, " +
          "and sends it to POST /api/playSession/init.\n" +
          // 3,5 at frontend/app/[locale]/play/playSessionAuth.ts
          // "4. Server verifies the JWT with BuildKey, signs the SessionKey public key as a JWT with ResultSecret, and returns it." +
          "5. Client sends POST /api/record and POST /api/playSession/sign with `Authorization: Bearer <token>` and result data signed with SessionKey." +
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
        400: {
          description: "Invalid signature or request body",
          content: {
            "application/json": {
              schema: resolver(await validationErrorSchema()),
            },
          },
        },
      },
    }),
    async (c) => {
      const token = await c.req.text();

      const buildPubKey = await crypto.subtle.importKey(
        "jwk",
        (await (
          await config.fetchStatic(
            env(c),
            new URL("/buildKey.json", backendOrigin(c))
          )
        ).json()) as JsonWebKey,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );

      let sessionPubKey: Record<string, unknown>;
      try {
        sessionPubKey = await verify(token, buildPubKey, "ES256");
      } catch {
        return c.json({ message: "badRequest" }, 400);
      }

      // Sign sessionPublicKey using ResultSecret into JWT
      const resultSecretPriv = await crypto.subtle.importKey(
        "pkcs8",
        base64UrlToBytes(env(c).RESULT_SECRET_PRIVATE_KEY!),
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign"]
      );
      const sessionToken = await sign(sessionPubKey, resultSecretPriv, "ES256");

      return c.text(sessionToken, 200, {
        "Content-Type": "application/jwt",
      });
    }
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
