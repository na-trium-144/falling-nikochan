export function fetchStatic(url: URL) {
  return fetch(url, {
    headers: {
      // https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
      // same as VERCEL_AUTOMATION_BYPASS_SECRET but manually set for preview env only
      "x-vercel-protection-bypass":
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET_PREVIEW_ONLY || "",
    },
  });
}
