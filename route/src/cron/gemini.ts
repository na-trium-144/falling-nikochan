import { GoogleGenAI } from "@google/genai";
import { Bindings } from "../env.js";

const GEMINI_CALL_INTERVAL_MS = 30 * 1000;
const GEMINI_HIGH_DEMAND_MESSAGE =
  "This model is currently experiencing high demand.";
const GEMINI_HIGH_DEMAND_RETRY_COUNT = 3;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGeminiHighDemandError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(GEMINI_HIGH_DEMAND_MESSAGE);
}

async function generateContentWithRetry(
  generate: () => Promise<string>
): Promise<string> {
  let retryCount = 0;
  while (retryCount <= GEMINI_HIGH_DEMAND_RETRY_COUNT) {
    try {
      return await generate();
    } catch (e) {
      if (
        isGeminiHighDemandError(e) &&
        retryCount < GEMINI_HIGH_DEMAND_RETRY_COUNT
      ) {
        retryCount++;
        await wait(GEMINI_CALL_INTERVAL_MS);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Exceeded Gemini retry limit");
}

async function generateContentInner(
  ai: GoogleGenAI,
  prompt: string,
  emptyErrorMessage = "Empty response from Gemini API"
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0,
    },
  });
  if (response.text?.trim()) {
    return response.text;
  } else {
    throw new Error(emptyErrorMessage);
  }
}

export async function generateContent(
  env: Bindings,
  prompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  try {
    return await generateContentWithRetry(() => generateContentInner(ai, prompt));
  } catch (e) {
    if (String(e).includes("User location is not supported")) {
      const proxyAi = new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY!,
        httpOptions: {
          baseUrl: "https://gemini-proxy.utcode.net",
        },
      });
      return await generateContentWithRetry(() =>
        generateContentInner(
          proxyAi,
          prompt,
          "Empty response from Gemini API via proxy"
        )
      );
    } else {
      throw e;
    }
  }
}

/**
 * Check if the content is safe to post on X (Twitter).
 * Returns null if safe, or a string describing the reason (Gemini's full output) if unsafe.
 */
export async function checkTextSafety(
  env: Bindings,
  content: string
): Promise<string | null> {
  content = content.replaceAll("`", "'");

  const promptJp = `以下の内容をX(Twitter)に投稿しても安全かどうかを予測してください。
センシティブな内容またはポリシー違反と判定される可能性のある文字列が少しでも含まれている場合は投稿を避ける必要があります。
\`#fallingnikochan\` と \`https://nikochan.utcode.net/\` は私の開発したアプリを指し安全であることはわかっているので、それ以外の部分のテキストを評価してください。
また、このアプリでは楽曲の埋め込みにYouTube埋め込みAPIを使用するため、著作権的な観点での考慮は不要です。
safe または unsafe のどちらかで回答してください。

\`\`\`
${content}
\`\`\`
`;
  const promptEn = `Predict whether the following content is safe to post on X (Twitter).
If it contains even a small amount of sensitive content or strings that may be considered policy violations, posting should be avoided.
I know that \`#fallingnikochan\` and \`https://nikochan.utcode.net/\` refer to the app I developed and are safe, so please evaluate the rest of the text.
Also, since this app uses the YouTube embed API to embed music, there are no copyright issues to consider.
Please respond with either "safe" or "unsafe".

\`\`\`
${content}
\`\`\`
`;

  const resJp = await generateContent(env, promptJp);
  await wait(GEMINI_CALL_INTERVAL_MS);
  const resEn = await generateContent(env, promptEn);

  const isSafeJp =
    !resJp.toLowerCase().includes("unsafe") &&
    resJp.toLowerCase().includes("safe");
  const isSafeEn =
    !resEn.toLowerCase().includes("unsafe") &&
    resEn.toLowerCase().includes("safe");

  if (isSafeJp && isSafeEn) {
    return null;
  }

  const reasons: string[] = [];
  if (!isSafeJp) {
    reasons.push(`Gemini (JP): ${resJp.trim()}`);
  }
  if (!isSafeEn) {
    reasons.push(`Gemini (EN): ${resEn.trim()}`);
  }
  return reasons.join("\n");
}
