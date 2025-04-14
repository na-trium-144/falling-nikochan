import { ChartBrief } from "@falling-nikochan/chart";

function briefKey(cid: string) {
  return "brief-" + cid;
}

export async function fetchBrief(
  cid: string,
  noCache?: boolean
): Promise<{ brief?: ChartBrief; ok: boolean; is404: boolean }> {
  const fetchRes = fetch(process.env.BACKEND_PREFIX + `/api/brief/${cid}`, {
    cache: noCache ? "no-store" : "default",
  });
  let stale: string | null = localStorage.getItem(briefKey(cid));
  if (stale) {
    if (stale.includes("{")) {
      compress(stale).then((compressed) => {
        localStorage.setItem(briefKey(cid), compressed);
      });
    } else {
      try {
        stale = await decompress(stale);
      } catch (e) {
        console.error("Failed to decompress cached data", e);
        stale = null;
      }
    }
  }
  if (stale && !noCache) {
    fetchRes
      .then(async (res) => {
        if (res.ok) {
          const brief = await res.text();
          const compressedBrief = await compress(brief);
          localStorage.setItem(briefKey(cid), compressedBrief);
        } else if (res.status == 404) {
          localStorage.removeItem(briefKey(cid));
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
        const brief = await res.text();
        const compressedBrief = await compress(brief);
        const briefObj = JSON.parse(brief);
        localStorage.setItem(briefKey(cid), compressedBrief);
        return {
          brief: briefObj,
          ok: true,
          is404: false,
        };
      } else {
        if (res.status == 404) {
          localStorage.removeItem(briefKey(cid));
        }
        return { ok: false, is404: res.status == 404 };
      }
    } catch {
      return { ok: false, is404: false };
    }
  }
}

async function compress(text: string): Promise<string> {
  // Convert text to a Uint8Array
  const encoder = new TextEncoder();
  const input = encoder.encode(text);
  // Compress using CompressionStream
  const cs = new CompressionStream("gzip");
  const compressedStream = new Blob([input]).stream().pipeThrough(cs);
  const compressedBlob = await new Response(compressedStream).blob();
  // Convert compressed data to Base64
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(await compressedBlob.arrayBuffer()))
  );
  return base64;
}
async function decompress(base64: string): Promise<string> {
  // Decode Base64 to binary data
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  // Decompress using DecompressionStream
  const ds = new DecompressionStream("gzip");
  const decompressedStream = new Blob([binary]).stream().pipeThrough(ds);
  const decompressedBlob = await new Response(decompressedStream).blob();
  // Convert decompressed data back to text
  const decoder = new TextDecoder();
  const text = decoder.decode(await decompressedBlob.arrayBuffer());
  return text;
}
