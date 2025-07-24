import { ChartBrief } from "@falling-nikochan/chart";

function briefKeyOld(cid: string) {
  return "brief-" + cid;
}
const briefCacheName = "brief1";

export async function fetchBrief(
  cid: string,
  noCache?: boolean
): Promise<{ brief?: ChartBrief; ok: boolean; is404: boolean }> {
  const fetchRes = fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
    cache: noCache ? "no-store" : "default",
  });
  const staleLS = localStorage.getItem(briefKeyOld(cid));
  let stale: string | undefined = undefined;
  let cache: Cache | undefined = undefined;
  if("caches" in window){
    cache = await window.caches.open(briefCacheName);
    window.caches
      .keys()
      .then((keys) =>
        keys
          .filter((k) => k.startsWith("brief") && k !== briefCacheName)
          .forEach((k) => window.caches.delete(k))
      );
    if (staleLS) {
      cache.put(`/api/brief/${cid}`, new Response(staleLS));
      localStorage.removeItem(briefKeyOld(cid));
    }
    stale =
      staleLS ||
      (await cache.match(`/api/brief/${cid}`).then((res) => res?.text()));
  }
  if (stale && !noCache) {
    fetchRes
      .then(async (res) => {
        if (res.ok) {
          cache?.put(`/api/brief/${cid}`, res);
        } else if (res.status == 404) {
          cache?.delete(`/api/brief/${cid}`);
          localStorage.removeItem(briefKeyOld(cid));
        }
      })
      .catch(() => undefined);
    return {
      brief: JSON.parse(stale) as ChartBrief,
      ok: true,
      is404: false,
    };
  } else {
    try {
      const res = await fetchRes;
      if (res.ok) {
        cache?.put(`/api/brief/${cid}`, res.clone());
        const brief = (await res.json()) as ChartBrief;
        return {
          brief,
          ok: true,
          is404: false,
        };
      } else {
        if (res.status == 404) {
          cache?.delete(`/api/brief/${cid}`);
          localStorage.removeItem(briefKeyOld(cid));
        }
        return { ok: false, is404: res.status == 404 };
      }
    } catch {
      return { ok: false, is404: false };
    }
  }
}
