import * as v from "valibot";

// GET /api/resultPublicKey
export const ResultPublicKeyResponseSchema = () =>
  v.object({
    publicKey: v.string(),
  });
export type ResultPublicKeyResponse = v.InferOutput<
  ReturnType<typeof ResultPublicKeyResponseSchema>
>;
