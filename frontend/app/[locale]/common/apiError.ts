const fetchErrorStatus = 499;

export class APIError {
  status: number | null;
  message: string;
  constructor(status: number | null, message: string) {
    this.status = status;
    this.message = message;
    if (this.status === fetchErrorStatus) {
      // 499はユーザーに表示しない
      this.status = null;
    }
  }
  static fetchError() {
    return new APIError(fetchErrorStatus, "fetchError");
  }
  static async fromRes(res: Response) {
    try {
      return new APIError(res.status, (await res.json()).message || "");
    } catch {
      return new APIError(res.status, "");
    }
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
