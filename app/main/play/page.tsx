import { ChartBrief } from "@/chartFormat/chart";
import PlayTab from "./clientPage";
import { getBrief } from "@/api/brief/brief";

const sampleCId = ["596134", "592994", "488006"];

export default async function PlayTabSSR() {
  let sampleBrief: { cid: string; brief?: ChartBrief }[] = [];

  for (const cid of sampleCId) {
    // const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
    const res = await getBrief(cid, false);
    if (res.ok) {
      // cidからタイトルなどを取得
      const resBody = await res.json();
      sampleBrief.push({ cid, brief: resBody });
    } else if (res.status === 404) {
      sampleBrief.push({ cid });
    }
  }

  return <PlayTab sampleBrief={sampleBrief} />;
}
