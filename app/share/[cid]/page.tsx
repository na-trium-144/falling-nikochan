import { ChartBrief } from "@/chartFormat/chart";
import Header from "@/common/header";
import { Box, Error } from "@/common/box";
import Button from "@/common/button";
import Footer from "@/common/footer";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";
import { PlayOption, ShareLink } from "./playOption";
import { FlexYouTubeShare } from "./youtube";
import { getBrief } from "@/api/brief/brief";
import { metaDataTitle, pageTitle } from "@/common/title";

export async function generateMetadata(context: { params: Params }) {
  const cid = context.params.cid;
  let brief: ChartBrief | undefined = undefined;

  // const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
  const res = await getBrief(cid);
  if (res.ok) {
    // cidからタイトルなどを取得
    brief = await res.json();
  }
  if (brief) {
    return metaDataTitle(pageTitle(cid, brief));
  } else {
    return metaDataTitle(`Not Found (ID: ${cid})`);
  }
}

export default async function ShareChart(context: { params: Params }) {
  const cid = context.params.cid;
  let brief: ChartBrief | undefined = undefined;
  let errorMsg: string | undefined = undefined;
  let errorStatus: number | undefined = undefined;

  // const res = await fetch(`/api/brief/${cid}`, { cache: "no-store" });
  const res = await getBrief(cid);
  if (res.ok) {
    // cidからタイトルなどを取得
    brief = await res.json();
  } else {
    errorStatus = res.status;
    try {
      errorMsg = String((await res.json()).message);
    } catch {
      errorMsg = "";
    }
  }

  if (!brief) {
    return <Error status={errorStatus} message={errorMsg} />;
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen h-max">
      <Header className="main-wide:hidden">ID: {cid}</Header>
      <div className={"flex-1 p-6 w-full flex items-center justify-center"}>
        <Box
          className="m-auto max-w-full flex flex-col p-6 shrink"
          style={{ flexBasis: "60rem" }}
        >
          <div className="main-wide:flex main-wide:flex-row-reverse main-wide:items-center">
            <FlexYouTubeShare ytId={brief.ytId} />
            <div className="main-wide:flex-1 main-wide:self-start">
              <Header className="hidden main-wide:block mb-2 pl-0">
                ID: {cid}
              </Header>
              <p className="font-title text-2xl">{brief?.title}</p>
              <p className="font-title text-lg">{brief?.composer}</p>
              <p className="mt-1">
                <span className="inline-block">
                  <span className="text-sm">Chart by</span>
                  <span className="ml-3 font-title text-lg">
                    {brief.chartCreator}
                  </span>
                </span>
                <span className="inline-block ml-3">
                  ({new Date(brief.updatedAt).toLocaleDateString()})
                </span>
              </p>
            </div>
          </div>
          <ShareLink cid={cid} brief={brief} />
          <PlayOption cid={cid} brief={brief} />
        </Box>
      </div>
      <Footer nav />
    </main>
  );
}
