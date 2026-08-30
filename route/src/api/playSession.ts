import { Context, Hono } from "hono";
import {
  Bindings,
  buildPubKey,
  ResponseOK,
  resultSecretPrivKey,
  resultSecretPubKey,
} from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { sign, verify } from "hono/jwt";
import { sValidatorHook } from "../error.js";
import type { webcrypto } from "node:crypto";
import { deserializeResultParams } from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";

export async function verifySessionPubKey(
  e: Bindings,
  authorization: string | undefined
) {
  if (!authorization) {
    throw new HTTPException(401, { message: "TODO" });
  }
  const { Authorization: authParams } = v.parse(
    v.object({ Authorization: v.strictObject({ "Bearer": v.string() }) }),
    { Authorization: Object.fromEntries([authorization.split(" ")]) }
  );

  const sessionPubKeyJWK = (await verify(
    authParams.Bearer,
    resultSecretPubKey(e),
    "ES256"
  )) as webcrypto.JsonWebKey;
  const sessionPubKey = await crypto.subtle.importKey(
    "jwk",
    sessionPubKeyJWK,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
  return sessionPubKey;
}

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
          "4. Server verifies the JWT with BuildKey, signs the SessionKey public key as a JWT with ResultSecret, and returns it." +
          // 4 here
          "5. Client sends POST /api/record and POST /api/playSession/sign with `Authorization: Bearer <token>` and result data signed with SessionKey." +
          "6. Server verifies the token with ResultSecret, verifies sign with SessionKey, verifies timestamp, and returns ResultSecret signature of result (skipped for auto play)." +
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
      async (c) => {
        let sessionPubKeyJWK: webcrypto.JsonWebKey;
        try {
          sessionPubKeyJWK = (await verify(
            await c.req.text(),
            await buildPubKey(c, config.fetchStatic),
            "ES256"
          )) as Record<string, unknown>;
        } catch {
          throw new HTTPException(400, { message: "TODO" });
        }

        const sessionToken = await sign(
          sessionPubKeyJWK as Record<string, unknown>,
          resultSecretPrivKey(env(c)),
          "ES256"
        );
        return c.text(sessionToken, 200, {
          "Content-Type": "application/jwt",
        });
      }
    )
    .post(
      "/sign",
      describeRoute({
        description: "Sign the play result data to share.",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            description: "`Bearer (JWT returned from /api/playSession/init)`.",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Successful response with signature",
            content: {
              "application/json": {
                schema: resolver(
                  v.object({
                    sign: v.pipe(
                      v.string(),
                      v.description("Signature of result with ResultSecret Key")
                    ),
                  })
                ),
              },
            },
          },
        },
      }),
      validator(
        "json",
        v.object({
          result: v.pipe(
            v.string(),
            v.description(
              "ResultParam serialized with msgpack and encoded as Base64Url"
            )
          ),
          clientSign: v.pipe(
            v.string(),
            v.description("Signature of result with SessionKey")
          ),
        }),
        sValidatorHook()
      ),
      async (c) => {
        const sessionPubKey = await verifySessionPubKey(
          env(c),
          c.req.header("Authorization")
        );

        const { result, clientSign } = c.req.valid("json");
        const clientSignBin = Buffer.from(clientSign, "base64url");
        const resultBin = Buffer.from(result, "base64url");

        try {
          if (
            !(await crypto.subtle.verify(
              { name: "ECDSA", hash: { name: "SHA-256" } },
              sessionPubKey,
              clientSignBin,
              resultBin
            ))
          ) {
            throw "not verified";
          }
        } catch {
          throw new HTTPException(422, { message: "TODO" });
        }

        const resultParams = deserializeResultParams(result);

        if (
          !resultParams.date ||
          Math.abs(resultParams.date.getTime() - Date.now()) > 1000 * 60 * 5 // 5 min
        ) {
          throw new HTTPException(422, { message: "TODO" });
        }

        const sign = await crypto.subtle.sign(
          { name: "ECDSA", hash: { name: "SHA-256" } },
          await resultSecretPrivKey(env(c)),
          resultBin
        );

        return c.json({ sign }, 200);
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
