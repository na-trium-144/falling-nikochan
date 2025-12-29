export class APIError {
  status: number | null;
  message: string;
  constructor(status: number | null, message: string) {
    this.status = status;
    this.message = message;
  }
  static async fromRes(res: Response) {
    try {
      return new APIError(res.status, (await res.json()).message || "");
    } catch {
      return new APIError(res.status, "");
    }
  }

  format(t: { (key: string): string; has: (key: string) => boolean }): string {
    let formattedMsg: string;
    if (t.has("api." + this.message)) {
      formattedMsg = t("api." + this.message);
    } else if (t.has(this.message)) {
      formattedMsg = t(this.message);
    } else {
      formattedMsg = t("unknownApiError");
    }
    if (this.status) {
      return `${this.status}: ${formattedMsg}`;
    } else {
      return formattedMsg;
    }
  }
}
