import { ChartBrief } from "@/chartFormat/chart";
import PlayTab from "./clientPage";
import { getBrief } from "@/api/brief/brief";

const sampleCId = ["596134", "592994", "488006"];

export default async function PlayTabSSR() {
  let sampleBrief: { cid: string; brief?: ChartBrief }[] = [];

  // Static Rendering ではなくSSRにさせるため、無意味なfetchをする
  try {
    await fetch("localhost:0", { cache: "no-store" });
  } catch {}

  for (const cid of sampleCId) {
    try {
      // const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
      const res = await getBrief(cid, false);
      if (res.ok) {
        // cidからタイトルなどを取得
        const resBody = await res.json();
        sampleBrief.push({ cid, brief: resBody });
      } else if (res.status === 404) {
        sampleBrief.push({ cid });
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

  return <PlayTab sampleBrief={sampleBrief} />;
}
