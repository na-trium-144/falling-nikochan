import { Hono } from "hono";
import { backendOrigin, Bindings, fetchStatic, ResponseOK } from "../env.js";
import {
  importPrivateKey,
  importPublicKey,
  PlaySessionPostSchema,
  PlaySessionResponseSchema,
} from "@falling-nikochan/chart";
import { env } from "hono/adapter";
import { describeRoute, resolver, validator } from "hono-openapi";
import { sValidatorHook, validationErrorSchema } from "../error.js";
import { sign, verify } from "hono/jwt";

const playSessionApp = async (config?: {
  fetchStatic?: (e: Bindings, url: URL) => Promise<ResponseOK>;
}) => {
  const app = new Hono<{ Bindings: Bindings }>({ strict: false });

  app.post(
    "/",
    describeRoute({
      description: `Authentication flow for score verification:
1. Secret key ResultSecret is configured in server env; public key is exposed via GET /api/resultPublicKey.
2. Build generates ephemeral BuildKey pair; private key in frontend env, public key at /buildKey.pub.
3. Client generates ephemeral SessionKey pair at /[locale]/play, signs SessionKey public key as a JWT with BuildKey, and sends it to POST /api/playSession.
4. Server verifies the JWT with BuildKey (/buildKey.pub), signs the SessionKey public key as a JWT with ResultSecret, and returns it.
5. Client sends POST /api/record with Authorization: Bearer <token>, result serialized data, sign (result msgpack signed with SessionKey), and other metadata.
6. Server verifies the token with ResultSecret, verifies sign with SessionKey, verifies timestamp, and returns ResultSecret signature of result (skipped for auto play).
7. Client saves and shares ResultParam with ResultSecret signature.
8. /og/result, /share, and /[locale]/share/placeholder verify ResultParam with ResultSecret public key.`,
      responses: {
        200: {
          description: "Successful response with session token",
          content: {
            "application/json": {
              schema: resolver(PlaySessionResponseSchema()),
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
    validator("json", PlaySessionPostSchema(), sValidatorHook()),
    async (c) => {
      const { token } = c.req.valid("json");
      const e = env(c);
      const origin = backendOrigin(c);

      const fetchFn = config?.fetchStatic || fetchStatic;
      const res = await fetchFn(e, new URL("/buildKey.pub", origin));
      const buildPubKeyStr = (await res.text()).trim();
      const buildPubKey = await importPublicKey(buildPubKeyStr);

      let payload: Record<string, unknown>;
      try {
        payload = await verify(token, buildPubKey, "ES256");
      } catch {
        return c.json({ message: "badRequest" }, 400);
      }

      const sessionPublicKey = payload.sessionPublicKey as string | undefined;
      if (!sessionPublicKey || typeof sessionPublicKey !== "string") {
        return c.json({ message: "badRequest" }, 400);
      }

      // Sign sessionPublicKey using ResultSecret into JWT
      const resultSecretPriv = await importPrivateKey(
        e.RESULT_SECRET_PRIVATE_KEY!
      );
      const sessionToken = await sign(
        {
          sessionPublicKey,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        },
        resultSecretPriv,
        "ES256"
      );

      return c.json({ token: sessionToken }, 200);
    }
  );

  return app;
};

export default playSessionApp;
