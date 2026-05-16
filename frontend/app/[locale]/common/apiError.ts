import * as Sentry from "@sentry/nextjs";

const fetchErrorStatus = 499;

/**
 * fetch()におけるネットワークエラーと5xxのサーバーエラーを統一して扱うクラス。
 * サーバーエラーの場合は自動的にSentryへの送信も行う。
 */
export class APIError extends Error {
  status: number | null;
  original?: unknown; // 一応sentryから確認するため
  // message: string;
  constructor(status: number | null, message: string, original?: unknown) {
    super(message);
    this.name = status ? `APIError-${status}` : "APIError";
    this.status = status;
    if (this.status === fetchErrorStatus) {
      // 499はユーザーに表示しない
      this.status = null;
    }
    this.original = original;
    if (this.original instanceof Error) {
      this.stack = this.original.stack;
      this.original.stack = undefined;
    } else if ("captureStackTrace" in Error) {
      Error.captureStackTrace(this, APIError);
    }
    if (this.isServerSide()) {
      Sentry.captureException(this);
    }
  }
  static fetchError(original: unknown) {
    if (
      original instanceof TypeError ||
      (original instanceof DOMException &&
        ["AbortError", "NotAllowedError"].includes(original.name))
    ) {
      return new APIError(fetchErrorStatus, "fetchError", original);
    } else {
      Sentry.captureException(`Object is not fetch error: ${original}`);
      throw original;
    }
  }
  static badResponse(original: unknown) {
    return new APIError(null, "badResponse", original);
  }
  static async fromRes(res: Response) {
    let e: APIError;
    try {
      e = new APIError(res.status, (await res.json()).message || "");
    } catch {
      e = new APIError(res.status, "");
    }
    Error.captureStackTrace(e, APIError);
    return e;
  }

  formatMsg(t: {
    (key: string): string;
    has: (key: string) => boolean;
  }): string {
    if (t.has("api." + this.message)) {
      return t("api." + this.message);
    } else if (t.has(this.message)) {
      return t(this.message);
    } else {
      return t("unknownApiError");
    }
  }
  format(t: { (key: string): string; has: (key: string) => boolean }): string {
    if (this.status) {
      return `${this.status}: ${this.formatMsg(t)}`;
    } else {
      return this.formatMsg(t);
    }
  }

  isServerSide() {
    return (
      (this.status !== null && (this.status === 403 || this.status >= 500)) ||
      this.message === "badResponse"
    );
  }
}
