import { Hono } from "hono";
import {
  Bindings,
  buildPubKey,
  cacheControl,
  ResponseOK,
  resultSecretKey,
} from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { sign, verify } from "hono/jwt";
import {
  errorLiteral,
  errorLiteralWithCause,
  sValidatorHook,
} from "../error.js";
import {
  deserializeResultParams,
  isVerificationRequired,
  parseResultParams,
  ResultParams,
  serializeDate4,
  signResultParams,
  verifyResultParams,
} from "@falling-nikochan/chart";
import { HTTPException } from "hono/http-exception";
import type { JsonWebKey } from "node:crypto";
import { CidSchema } from "@falling-nikochan/chart";
import { validationErrorSchema } from "../error.js";

const VERIFY_CACHE_MAX_AGE = 3600;

const SessionTokenPayloadSchema = () =>
  v.object({
    // ここにはJWTの標準クレームを含まず、looseObjectにもしない。/initで元のリクエストに含まれるexpやnbfがコピーされるのを防ぐため
    key: v.pipe(v.looseObject({}), v.description("JsonWebKey")),
    cid: CidSchema(),
    date: v.pipe(v.number(), v.integer(), v.description("Epoch milliseconds")),
  });

export async function verifyResultSessionPubKey(
  e: Bindings,
  authorization: string | undefined
) {
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearerToken) {
    throw new HTTPException(401, { message: "unauthorizedSessionToken" });
  }
  const sessionPayload = await verify(
    bearerToken,
    await resultSecretKey(e),
    "HS256"
  ).catch((e) => {
    throw new HTTPException(401, {
      message: "unauthorizedSessionToken",
      cause: e,
    });
  });
  const { key, cid } = v.parse(SessionTokenPayloadSchema(), sessionPayload);
  return {
    key: await crypto.subtle.importKey(
      "jwk",
      key as JsonWebKey,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["verify"]
    ),
    cid,
  };
}

const resultSigningApp = async (config: {
  fetchStatic: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) =>
  new Hono<{ Bindings: Bindings }>({ strict: false })
    .post(
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
          "5. Client sends POST /api/record and POST /api/resultSigning/sign with `Authorization: Bearer <token>` and result data signed with ResultSessionKey.\n" +
          "6. Server verifies the signature of token and record/result, verifies cid and timestamp, and stores the record anonymously / returns ResultSecret signature of result.\n" +
          // 6 at here and route/src/api/record.ts
          "7. Client saves and shares ResultParam with ResultSecret signature.\n" +
          "8. /og/result, /share, and /api/resultSigning/verify/:cid verify ResultParam.\n" +
          "\n" +
          "This API performs the step 4.",
        requestBody: {
          description:
            "A payload of `key`, `cid`, and `date` signed with ResultBuildKey as a JWT",
          required: true,
          content: {
            "application/jwt": {
              schema: (
                await resolver(SessionTokenPayloadSchema()).toOpenAPISchema()
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
                schema: resolver(SessionTokenPayloadSchema()),
              },
            },
          },
          400: {
            description: "invalid payload",
            content: {
              "application/json": {
                schema: resolver(await validationErrorSchema("badRequest")),
              },
            },
          },
          401: {
            description:
              "Verification of request body with ResultBuildKey failed",
            content: {
              "application/json": {
                schema: resolver(
                  await errorLiteralWithCause("unauthorizedResultBuildKey")
                ),
              },
            },
          },
          409: {
            description: "Client clock is out of sync with server",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("timeMismatch")),
              },
            },
          },
        },
      }),
      async (c) => {
        const payload = await verify(
          await c.req.text(),
          await buildPubKey(c, config.fetchStatic),
          "ES256"
        ).catch((e) => {
          throw new HTTPException(401, {
            message: "unauthorizedResultBuildKey",
            cause: e,
          });
        });
        const tokenPayload = v.parse(SessionTokenPayloadSchema(), payload); // ValiError -> 400

        if (Math.abs(tokenPayload.date - Date.now()) > 1000 * 60 * 60) {
          throw new HTTPException(409, { message: "timeMismatch" });
        }

        const sessionToken = await sign(
          {
            ...tokenPayload,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // 3 hours
          },
          await resultSecretKey(env(c)),
          "HS256"
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
            description:
              "`Bearer (JWT returned from /api/resultSigning/init)`.",
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
                      v.description(
                        "Base64Url encoded signature of result with ResultSecret Key"
                      )
                    ),
                  })
                ),
              },
            },
          },
          400: {
            description: "invalid token payload or result data",
            content: {
              "application/json": {
                schema: resolver(
                  await validationErrorSchema(
                    "badRequest",
                    "invalidResultParam"
                  )
                ),
              },
            },
          },
          401: {
            description: "Verification of token failed",
            content: {
              "application/json": {
                schema: resolver(
                  await errorLiteralWithCause("unauthorizedSessionToken")
                ),
              },
            },
          },
          409: {
            description: "Client clock is out of sync with server",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("timeMismatch")),
              },
            },
          },
          422: {
            description: "Verification of result data failed",
            content: {
              "application/json": {
                schema: resolver(
                  await errorLiteralWithCause("unauthorizedSessionData")
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
            v.description(
              "Base64Url encoded signature of result with ResultSessionKey"
            )
          ),
        }),
        sValidatorHook()
      ),
      async (c) => {
        const { key: sessionPubKey, cid: sessionCid } =
          await verifyResultSessionPubKey(
            env(c),
            c.req.header("Authorization")
          );

        const { result, clientSign } = c.req.valid("json");
        const clientSignBin = Buffer.from(clientSign, "base64url");
        const resultBin = Buffer.from(result, "base64url");

        await crypto.subtle
          .verify(
            { name: "ECDSA", hash: { name: "SHA-256" } },
            sessionPubKey,
            clientSignBin,
            resultBin
          )
          .catch((e) => {
            throw new HTTPException(422, {
              message: "unauthorizedSessionData",
              cause: e,
            });
          })
          .then((verified) => {
            if (!verified) {
              throw new HTTPException(422, {
                message: "unauthorizedSessionData",
              });
            }
          });

        let resultParams: ResultParams;
        try {
          resultParams = deserializeResultParams(result);
        } catch {
          throw new HTTPException(400, { message: "invalidResultParam" });
        }

        if (!resultParams.cid || resultParams.cid !== sessionCid) {
          throw new HTTPException(422, { message: "unauthorizedSessionData" });
        }

        if (
          !resultParams.date ||
          Math.abs(
            serializeDate4(new Date()) - serializeDate4(resultParams.date)
          ) > 1
        ) {
          throw new HTTPException(409, { message: "timeMismatch" });
        }

        const sign = await signResultParams(
          resultBin,
          await resultSecretKey(env(c))
        );

        return c.json({ sign: Buffer.from(sign).toString("base64url") }, 200);
      }
    )
    .get(
      "/verify/:cid",
      describeRoute({
        description: "Verify the shared play result data.",
        responses: {
          200: {
            description: "Successful verification",
            headers: {
              "Cache-Control": {
                description: `max-age=${VERIFY_CACHE_MAX_AGE}`,
                schema: { type: "string" },
              },
            },
          },
          400: {
            description:
              "invalid parameter or verification not applicable for this result",
            content: {
              "application/json": {
                schema: resolver(
                  v.union([
                    await validationErrorSchema(
                      "badRequest",
                      "invalidResultParam"
                    ),
                    await errorLiteral("verificationNotApplicable"),
                  ])
                ),
              },
            },
          },
          422: {
            description: "Failed verification",
            content: {
              "application/json": {
                schema: resolver(await errorLiteral("unauthorizedResultParam")),
              },
            },
            headers: {
              "Cache-Control": {
                description: `max-age=${VERIFY_CACHE_MAX_AGE}`,
                schema: { type: "string" },
              },
            },
          },
        },
      }),
      validator(
        "query",
        v.object({
          result: v.pipe(
            v.string(),
            v.description(
              "ResultParam and signature encoded as Base64Url and concatenated with '.'"
            )
          ),
        }),
        sValidatorHook()
      ),
      async (c) => {
        const { result: qResult } = c.req.valid("query");
        let result: Uint8Array;
        let sign: Uint8Array | undefined;
        let resultParams: ResultParams;
        try {
          const parsed = await parseResultParams(qResult);
          result = parsed.result;
          sign = parsed.sign;
          resultParams = deserializeResultParams(result);
        } catch {
          throw new HTTPException(400, { message: "invalidResultParam" });
        }
        if (!isVerificationRequired(resultParams)) {
          return c.json({ message: "verificationNotApplicable" }, 400, {
            "Cache-Control": cacheControl(env(c), VERIFY_CACHE_MAX_AGE),
          });
        }
        if (
          await verifyResultParams(
            { result, sign },
            resultParams,
            c.req.param("cid"),
            await resultSecretKey(env(c))
          )
        ) {
          return c.body(null, 200, {
            "Cache-Control": cacheControl(env(c), VERIFY_CACHE_MAX_AGE),
          });
        } else {
          return c.json({ message: "unauthorizedResultParam" }, 422, {
            "Cache-Control": cacheControl(env(c), VERIFY_CACHE_MAX_AGE),
          });
        }
      }
    );

export default resultSigningApp;
