import { Hono } from "hono";
import { Bindings, buildPubKey, ResponseOK, resultSecretKey } from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver } from "hono-openapi";
import * as v from "valibot";
import { sign, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import type { JsonWebKey } from "node:crypto";
import { CidSchema } from "@falling-nikochan/chart";
import { JWTPayload } from "hono/utils/jwt/types";
import { validationErrorSchema } from "../error.js";

const SessionTokenPayloadSchema = () =>
  v.object({
    key: v.pipe(
      v.looseObject({}),
      v.transform((key) =>
        crypto.subtle.importKey(
          "jwk",
          key as JsonWebKey,
          { name: "ECDSA", namedCurve: "P-256" },
          true,
          ["verify"]
        )
      )
    ),
    cid: CidSchema(),
  });

const resultSigningApp = async (config: {
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false }).post(
    "/init",
    describeRoute({
      description:
        "Authentication flow for chart result verification:\n" +
        "1. Secret key ResultSecret is configured in server.\n" +
        // 1 at route/src/env.ts, route/generateSecretKey.ts
        "2. Build generates ephemeral ResultBuildKey pair; private key in frontend env, public key at /resultBuildKey.json.\n" +
        // 2 at frontend/initAssets.js
        "3. Client generates ephemeral ResultSessionKey pair at /[locale]/play, " +
        "signs ResultSessionKey public key and cid as a JWT with ResultBuildKey, " +
        "and sends it to POST /api/resultSigning/init.\n" +
        // 3,5 at frontend/app/[locale]/play/resultSigningAuth.ts
        "4. Server verifies the JWT with BuildKey, adds 3-hour expiration (exp), signs it as a JWT with ResultSecret, and returns it.\n" +
        // 4 here
        // "5. Client sends POST /api/record and POST /api/resultSigning/sign with `Authorization: Bearer <token>` and result data signed with ResultSessionKey.\n" +
        // "6. Server verifies the signature of token and record/result, verifies cid and timestamp, and stores the record anonymously / returns ResultSecret signature of result.\n" +
        // "7. Client saves and shares ResultParam with ResultSecret signature.\n" +
        // "8. /og/result, /share, and /[locale]/share/placeholder verify ResultParam with GET /api/resultSigning/verify.",
        "\n" +
        "This API performs the step 4.",
      requestBody: {
        description:
          "A payload of `key` and `cid` signed with ResultBuildKey as a JWT",
        required: true,
        content: {
          "application/jwt": {
            schema: (
              await resolver(
                v.object({
                  key: v.pipe(v.looseObject({}), v.description("JsonWebKey")),
                  cid: CidSchema(),
                })
              ).toOpenAPISchema()
            ).schema,
          },
        },
      },
      responses: {
        200: {
          description:
            "A payload with 3-hour expiration (exp) signed with ResultSecret key as a JWT",
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
          description:
            "Verification of request body with ResultBuildKey failed",
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
      } catch (err) {
        throw new HTTPException(401, {
          message: "unauthorizedResultBuildKey",
          cause: err,
        });
      }
      v.parse(SessionTokenPayloadSchema(), payload); // ValiError -> 400

      const sessionToken = await sign(
        {
          ...payload,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // 3 hours
        },
        await resultSecretKey(env(c)),
        "HS256"
      );
      return c.text(sessionToken, 200, {
        "Content-Type": "application/jwt",
      });
    }
  );

export default resultSigningApp;
