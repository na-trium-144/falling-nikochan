export const FETCH_ERROR_STATUS = 499;

/**
 * fetch()におけるネットワークエラーと5xxのサーバーエラー、その他処理中に起きたロジックエラーを統一して扱うクラス。
 */
export class APIError extends Error {
  url: string;
  status: number;
  body: unknown;
  fingerprint: string[];
  /**
   * false の場合、Sentryに報告し、さらに問い合わせフォームを出せる場所では出す
   */
  expected: boolean = false;
  constructor(
    url: string,
    status: number,
    message: string,
    stack: string,
    body: unknown
  ) {
    super(message);
    this.name = `APIError-${status}`;
    this.status = status;
    if (status === FETCH_ERROR_STATUS) {
      this.expected = true;
    }
    this.url = url;
    this.stack = stack;
    this.body = body;
    this.fingerprint = [
      this.name,
      this.message,
      // url内のパラメータ部分を消す (cid, lvIndex など)
      // TODO: 数値以外がパラメータになるAPIが今後作られた場合ロジックを変更する必要がある
      new URL(this.url).pathname.replace(/\/[0-9]*/g, ""),
    ];
  }

  formatMsg(t: {
    (key: string): string;
    has: (key: string) => boolean;
  }): string {
    if (this.status === FETCH_ERROR_STATUS) {
      return t("api.fetchError");
    } else if (t.has("api." + this.message)) {
      return t("api." + this.message);
    } else if (t.has(this.message)) {
      return t(this.message);
    } else {
      if (this.status === 400) {
        return t("api.badRequest");
      } else if (this.status === 404) {
        return t("api.notFound");
      } else {
        return t("unknownApiError");
      }
    }
  }
  format(t: { (key: string): string; has: (key: string) => boolean }): string {
    if (this.status !== FETCH_ERROR_STATUS) {
      return `${this.status}: ${this.formatMsg(t)}`;
    } else {
      return this.formatMsg(t);
    }
  }
}

/**
 * expected をtrueにセットしてrethrow
 */
export function markAsExpected(e: APIError): never {
  e.expected = true;
  throw e;
}
