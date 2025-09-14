import { GoogleGenAI } from "@google/genai";
import { Bindings } from "../env.js";

export async function generateContent(
  env: Bindings,
  prompt: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    if (response.text?.trim()) {
      return response.text;
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (e) {
    if (String(e).includes("User location is not supported")) {
      const ai = new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY!,
        httpOptions: {
          baseUrl: "https://gemini-proxy.utcode.net",
        },
      });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      if (response.text?.trim()) {
        return response.text;
      } else {
        throw new Error("Empty response from Gemini API via proxy");
      }
    } else {
      throw e;
    }
  }
}

export async function checkTextSafety(
  env: Bindings,
  content: string
): Promise<boolean> {
  content = content.replaceAll("`", "'");

  const promptJp = `以下の内容をX(Twitter)に投稿しても安全かどうかを予測してください。
センシティブな内容またはポリシー違反と判定される可能性のある文字列が少しでも含まれている場合は投稿を避ける必要があります。
safe または unsafe のどちらかで回答してください。

\`\`\`
${content}
\`\`\`
`;
  const promptEn = `Predict whether the following content is safe to post on X (Twitter).
If it contains even a small amount of sensitive content or strings that may be considered policy violations, posting should be avoided.
Please respond with either "safe" or "unsafe".

\`\`\`
${content}
\`\`\`
`;

  const isSafeJp = generateContent(env, promptJp).then(
    (res) =>
      !res.toLowerCase().includes("unsafe") &&
      !res.toLowerCase().includes("not safe") &&
      res.toLowerCase().includes("safe")
  );
  const isSafeEn = generateContent(env, promptEn).then(
    (res) =>
      !res.toLowerCase().includes("unsafe") &&
      !res.includes("not safe") &&
      res.toLowerCase().includes("safe")
  );
  return (await isSafeJp) && (await isSafeEn);
}
