import Header from "@/common/header";
import { Box, Error } from "@/common/box";
import Footer from "@/common/footer";
import { PlayOption, ShareLink, ShareState } from "./playOption";
import { FlexYouTubeShare } from "./youtube";
import { getBrief } from "@/api/brief/brief";
import { metaDataTitle, pageTitle } from "@/common/title";
import { Params } from "next/dist/server/request/params";

export async function generateMetadata(context: { params: Promise<Params> }) {
  const cid = String((await context.params).cid);

  const { res, brief } = await getBrief(cid, true);
  if (brief) {
    return metaDataTitle(pageTitle(cid, brief));
  } else {
    return metaDataTitle(`Not Found (ID: ${cid})`);
  }
}

export default async function ShareChart(context: { params: Promise<Params> }) {
  const cid = String((await context.params).cid);
  const { res, brief } = await getBrief(cid, true);

  if (!brief) {
    return <Error status={res?.status || 500} message={res?.message || ""} />;
  }

  return (
    <main className="flex flex-col items-center w-full min-h-dvh h-max">
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
                <span className="inline-block ml-3 text-slate-500 dark:text-stone-400 ">
                  <ShareState cid={cid} brief={brief} />
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
