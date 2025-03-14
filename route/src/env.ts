export interface Bindings {
  MONGODB_URI: string;
  API_ENV?: "development";
  API_NO_RATELIMIT?: "1";
  SECRET_SALT?: string;
  API_CACHE_EDGE?: "1";
  ASSET_PREFIX?: string;
  VERCEL_PROTECTION_BYPASS_SECRET?: string;
}

export function secretSalt(e: Bindings) {
  if (e.SECRET_SALT) {
    return e.SECRET_SALT!;
  } else if (e.API_ENV === "development") {
    return "SecretSalt";
  } else {
    throw new Error("SECRET_SALT not set in production environment!");
  }
}

export function cacheControl(e: Bindings, age: number | null) {
  if (age) {
    if (e.API_CACHE_EDGE) {
      return `max-age=${age}, s-maxage=${age}`;
    } else {
      return `max-age=${age}`;
    }
  } else {
    return "no-store";
  }
}

export function fetchStatic(e: Bindings, url: URL) {
  return fetch(new URL(url.pathname, e.ASSET_PREFIX || url.origin), {
    headers: {
      // https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
      // same as VERCEL_AUTOMATION_BYPASS_SECRET but manually set for preview env only
      ...(e.VERCEL_PROTECTION_BYPASS_SECRET
        ? {
            "x-vercel-protection-bypass": e.VERCEL_PROTECTION_BYPASS_SECRET,
          }
        : {}),
    },
  });
}
