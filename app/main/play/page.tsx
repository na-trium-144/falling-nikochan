import { ChartBrief } from "@/chartFormat/chart";
import PlayTab from "./clientPage";
import { getBrief } from "@/api/brief/brief";

const originalCId = ["602399"];
const sampleCId = ["596134", "592994", "488006"];

export default async function PlayTabSSR() {
  let sampleBrief: { [key in string]: ChartBrief } = {};

  // Static Rendering ではなくSSRにさせるため、無意味なfetchをする
  try {
    await fetch("localhost:0", { cache: "no-store" });
  } catch {}

  for (const cid of sampleCId.concat(originalCId)) {
    try {
      // const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
      const res = await getBrief(cid, false);
      if (res.ok) {
        // cidからタイトルなどを取得
        const resBody = await res.json();
        sampleBrief[cid] = resBody;
      } else if (res.status === 404) {
      } else {
        try {
          const resBody = await res.json();
          console.error(
            `Failed to fetch brief of ${cid}: ${res.status} ${resBody.message}`
          );
        } catch {
          console.error(`Failed to fetch brief of ${cid}: ${res.status}`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <PlayTab
      sampleBrief={sampleBrief}
      originalCId={originalCId}
      sampleCId={sampleCId}
    />
  );
}
