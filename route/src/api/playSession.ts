import { Hono } from "hono";
import {
  Bindings,
  buildPubKey,
  ResponseOK,
  resultSecretPrivKey,
  resultSecretPubKey,
} from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import { sign, verify } from "hono/jwt";
import type { JsonWebKey } from "node:crypto";
import { CidSchema } from "@falling-nikochan/chart";
import { JWTPayload } from "hono/utils/jwt/types";
import { HTTPException } from "hono/http-exception";
import { validationErrorSchema } from "../error.js";

const SessionTokenPayloadSchema = () =>
  v.object({
    key: v.pipe(
      v.object({}),
      v.transform((v) => v as JsonWebKey)
    ),
    cid: CidSchema(),
  });
type SessionTokenPayload = v.InferOutput<
  ReturnType<typeof SessionTokenPayloadSchema>
>;

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
          "4. Server verifies the JWT with BuildKey, signs the same payload (SessionKey public key and cid) as a JWT with ResultSecret, and returns it.\n" +
          // 4 here
          "5. Client sends POST /api/record and POST /api/playSession/sign with `Authorization: Bearer <token>` and result data signed with SessionKey.\n" +
          // "6. Server verifies the token with ResultSecret, verifies sign with SessionKey, verifies timestamp, and returns ResultSecret signature of result (skipped for auto play)." +
          "7. Client saves and shares ResultParam with ResultSecret signature." +
          // "8. /og/result, /share, and /[locale]/share/placeholder verify ResultParam with ResultSecret public key.",
          "\n" +
          "This API performs the step 4.",
        requestBody: {
          description:
            'A payload in the format `{ "key": JsonWebKey, "cid": string }` signed with ResultBuildKey as a JWT',
          required: true,
          content: {
            "application/jwt": {
              schema: (await resolver(v.string()).toOpenAPISchema()).schema,
            },
          },
        },
        responses: {
          200: {
            description:
              "The same payload signed with ResultSecret key as a JWT",
            content: {
              "application/jwt": {
                schema: resolver(v.string()),
              },
            },
          },
          400: {
            description: "invalid payload",
            content: {
              "application/json": {
                schema: resolver(await validationErrorSchema()),
              },
            },
          },
          401: {
            description: "Verification of request body failed",
            content: {
              "application/json": {
                schema: resolver(v.string()), // TODO
              },
            },
          },
        },
      }),
      async (c) => {
        let payload: JWTPayload;
        try {
          payload = await verify(
            await c.req.text(),
            await buildPubKey(c, config.fetchStatic),
            "ES256"
          );
        } catch {
          throw new HTTPException(401, {
            message: "unauthorizedResultBuildKey",
          });
        }
        v.parse(SessionTokenPayloadSchema(), payload); // ValiError -> 400

        const sessionToken = await sign(
          payload,
          await resultSecretPrivKey(env(c)),
          "ES256"
        );
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
