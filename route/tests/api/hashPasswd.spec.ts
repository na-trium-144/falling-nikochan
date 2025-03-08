import { expect, test, describe } from "bun:test";
import app from "@falling-nikochan/route";
import { hash } from "@falling-nikochan/chart";

describe("GET /api/hashPasswd/:cid", () => {
  test("should return hashed password and random hashKey", async () => {
    const res = await app.request("/api/hashPasswd/100000?pw=abc");
    expect(res.status).toBe(200);
    const resHash = await res.text();
    const hashKey = res.headers.get("Set-Cookie")?.split(";")[0].split("=")[1];
    console.log(hashKey);
    expect(hashKey).toBeString();
    expect(hashKey).not.toBeEmpty();
    expect(resHash).toBe(await hash("100000abc" + hashKey));
  });
  test("should use same hashKey if it is set in the cookie", async () => {
    const res = await app.request("/api/hashPasswd/100000?pw=abc", {
      headers: { Cookie: "hashKey=def" },
    });
    expect(res.status).toBe(200);
    const resHash = await res.text();
    const hashKey = res.headers.get("Set-Cookie")?.split(";")[0].split("=")[1];
    expect(hashKey).toBe("def");
    expect(resHash).toBe(await hash("100000abcdef"));
  });
});
