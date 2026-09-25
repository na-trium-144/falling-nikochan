import { Hono } from "hono";
import {
  Bindings,
  buildPubKey,
  immutable,
  ResponseOK,
  resultSecretKey,
} from "../env.js";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import { sign, verify } from "hono/jwt";
import { sValidatorHook } from "../error.js";
import {
  deserializeResultParams,
  isVerificationRequired,
  ResultParams,
  verifyResultParams,
} from "@falling-nikochan/chart";
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

export async function verifyResultSessionPubKey(
  e: Bindings,
  authorization: string | undefined
) {
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearerToken) {
    throw new HTTPException(401, { message: "unauthorizedSessionToken" });
  }
  let sessionPayload: JWTPayload;
  try {
    sessionPayload = await verify(
      bearerToken,
      await resultSecretKey(e),
      "HS256"
    );
  } catch (err) {
    throw new HTTPException(401, {
      message: "unauthorizedSessionToken",
      cause: err,
    });
  }
  return v.parse(SessionTokenPayloadSchema(), sessionPayload);
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
                schema: resolver(await validationErrorSchema()),
              },
            },
          },
          401: {
            description: "Verification of token failed",
            content: {
              "application/json": {
                schema: resolver(v.string()), // TODO
              },
            },
          },
          422: {
            description: "Verification of result data failed",
            content: {
              "application/json": {
                schema: resolver(v.string()), // TODO
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
          await verifyResultSessionPubKey(env(c), c.req.header("Authorization"));

        const { result, clientSign } = c.req.valid("json");
        const clientSignBin = Buffer.from(clientSign, "base64url");
        const resultBin = Buffer.from(result, "base64url");

        try {
          if (
            !(await crypto.subtle.verify(
              { name: "ECDSA", hash: { name: "SHA-256" } },
              await sessionPubKey,
              clientSignBin,
              resultBin
            ))
          ) {
            throw "not verified";
          }
        } catch {
          throw new HTTPException(422, { message: "unauthorizedSessionData" });
        }

        let resultParams: ResultParams;
        try {
          resultParams = deserializeResultParams(result);
        } catch {
          throw new HTTPException(400, { message: "invalidResultParam" });
        }

        if (
          !resultParams.cid ||
          resultParams.cid !== sessionCid
          // !resultParams.date ||
          // Math.abs(resultParams.date.getTime() - Date.now()) > 1000 * 60 * 5 // 5 min
        ) {
          throw new HTTPException(422, { message: "unauthorizedSessionData" });
        }

        const sign = await crypto.subtle.sign(
          { name: "HMAC", hash: { name: "SHA-256" } },
          await resultSecretKey(env(c)),
          resultBin
        );

        return c.json({ sign: Buffer.from(sign).toString("base64url") }, 200);
      }
    )
    .get(
      "/verify/:cid",
      describeRoute({
        description: "Verify the shared play result data.",
        responses: {
          204: {
            description: "Successful verification",
            headers: {
              "Cache-Control": {
                description: `immutable`,
                schema: { type: "string" },
              },
            },
          },
          400: {
            description: "invalid parameter",
            content: {
              "application/json": {
                schema: resolver(await validationErrorSchema()),
              },
            },
          },
          409: {
            description: "Verification not applicable for older results",
            content: {
              "application/json": {
                schema: resolver(v.string()), // TODO
              },
            },
          },
          422: {
            description: "Failed verification",
            content: {
              "application/json": {
                schema: resolver(v.string()), // TODO
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
        const { result } = c.req.valid("query");
        let resultParams: ResultParams;
        try {
          resultParams = deserializeResultParams(result);
        } catch {
          throw new HTTPException(400, { message: "invalidResultParam" });
        }
        if (!isVerificationRequired(resultParams)) {
          throw new HTTPException(409, {
            message: "verificationNotApplicable",
          });
        }
        if (!resultParams.cid || resultParams.cid !== c.req.param("cid")) {
          throw new HTTPException(422, { message: "unauthorizedResultParam" });
        }
        if (await verifyResultParams(result, await resultSecretKey(env(c)))) {
          return c.body(null, 204, {
            "Cache-Control": immutable(),
          });
        } else {
          throw new HTTPException(422, { message: "unauthorizedResultParam" });
        }
      }
    );

export default resultSigningApp;
