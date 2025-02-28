import { ChartBrief } from "@falling-nikochan/chart";

function briefKey(cid: string) {
  return "brief-" + cid;
}

export async function fetchBrief(
  cid: string
): Promise<{ brief?: ChartBrief; ok: boolean; is404: boolean }> {
  const fetchRes = fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
    cache: "default",
  });
  const stale = localStorage.getItem(briefKey(cid));
  if (stale) {
    fetchRes.then(async (res) => {
      if (res.ok) {
        localStorage.setItem(briefKey(cid), await res.text());
      } else if (res.status == 404) {
        localStorage.removeItem(briefKey(cid));
      }
    });
    return {
      brief: JSON.parse(stale) as ChartBrief,
      ok: true,
      is404: false,
    };
  } else {
    const res = await fetchRes;
    if (res.ok) {
      const brief = (await res.json()) as ChartBrief;
      localStorage.setItem(briefKey(cid), JSON.stringify(brief));
      return {
        brief,
        ok: true,
        is404: false,
      };
    } else {
      if (res.status == 404) {
        localStorage.removeItem(briefKey(cid));
      }
      return { ok: false, is404: res.status == 404 };
    }
  }
}
