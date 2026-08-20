import * as v from "valibot";

// POST /api/playSession
export const PlaySessionPostSchema = () =>
  v.object({
    token: v.string(),
  });
export type PlaySessionPost = v.InferOutput<
  ReturnType<typeof PlaySessionPostSchema>
>;

export const PlaySessionResponseSchema = () =>
  v.object({
    token: v.string(),
  });
export type PlaySessionResponse = v.InferOutput<
  ReturnType<typeof PlaySessionResponseSchema>
>;
