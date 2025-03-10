export interface Bindings {
  MONGODB_URI: string;
  API_ENV: "development" | undefined;
  API_NO_RATELIMIT: "1" | undefined;
  SECRET_SALT: string | undefined;
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
