import { ChartBrief } from "@/chartFormat/chart";
import PlayTab from "./clientPage";
import { getBrief } from "@/api/brief/brief";
import { originalCId, sampleCId } from "../const";

export default async function PlayTabSSR() {
  const originalBriefPromise = Promise.all(
    originalCId.map(async (cid) => {
      const { res, brief } = await getBrief(cid, false);
      if (brief) {
        return { cid, brief };
      } else {
        // console.warn(
        //   `Failed to fetch brief of ${cid}: ${res?.status} ${res?.message}`
        // );
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
        // console.warn(
        //   `Failed to fetch brief of ${cid}: ${res?.status} ${res?.message}`
        // );
        return { cid, brief: undefined };
      }
    })
  );

  return (
    <PlayTab
      sampleBrief={await sampleBriefPromise}
      originalBrief={await originalBriefPromise}
    />
  );
}
