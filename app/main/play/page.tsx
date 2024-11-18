import { ChartBrief } from "@/chartFormat/chart";
import PlayTab from "./clientPage";
import { getBrief } from "@/api/brief/brief";

const originalCId = ["602399"];
const sampleCId = ["596134", "592994", "488006"];

export default async function PlayTabSSR() {
  const originalBriefPromise = Promise.all(
    originalCId.map(async (cid) => {
      const { res, brief } = await getBrief(cid, false);
      if (brief) {
        return { cid, brief };
      } else {
        console.warn(
          `Failed to fetch brief of ${cid}: ${res?.status} ${res?.message}`
        );
        return { cid, brief: undefined };
      }
    })
  );
  const sampleBriefPromise = Promise.all(
    sampleCId.map(async (cid) => {
      const { res, brief } = await getBrief(cid, false);
      if (brief) {
        return { cid, brief };
      } else {
        console.warn(
          `Failed to fetch brief of ${cid}: ${res?.status} ${res?.message}`
        );
        return { cid, brief: undefined };
      }
    })
  );

  // Static Rendering ではなくSSRにさせるため、無意味なfetchをする
  try {
    await fetch("localhost:0", { cache: "no-store" });
  } catch {}

  return (
    <PlayTab
      sampleBrief={await sampleBriefPromise}
      originalBrief={await originalBriefPromise}
    />
  );
}
