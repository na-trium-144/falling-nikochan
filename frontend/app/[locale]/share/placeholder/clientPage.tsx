"use client";

import {
  ChartBrief,
  deserializeResultParams,
  RecordGetSummary,
  ResultParams,
} from "@falling-nikochan/chart";
import { ReactNode, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { titleShare } from "@/common/title.js";
import { ShareBox } from "./shareBox.js";
import { Box } from "@/common/box.js";
import { RedirectedWarning } from "@/common/redirectedWarning.js";
import Link from "next/link.js";
import Title from "@/common/titleLogo.jsx";
import { linkStyle1, linkStyle3 } from "@/common/linkStyle.js";
import { MobileFooter, PCFooter } from "@/common/footer.jsx";
import { AboutModal } from "@/clientPage.jsx";

const dummyBrief = {
  title: "placeholder",
  composer: "placeholder",
  chartCreator: "placeholder",
  ytId: "",
  updatedAt: 0,
  published: true,
  locale: "ja",
  levels: [
    {
      name: "placeholder",
      hash: "",
      type: "Single" as const,
      difficulty: 10,
      noteCount: 100,
      bpmMin: 1,
      bpmMax: 999,
      length: 1,
      unlisted: false,
    },
  ],
};

interface Props {
  locale: string;
  aboutContents: ReactNode[];
}
export default function ShareChart(props: Props) {
  const t = useTranslations("share");
  const tm = useTranslations("main");
  const { locale } = props;
  const [cid, setCId] = useState<string>("");
  // const { res, brief } = await getBrief(cid, true);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [record, setRecord] = useState<RecordGetSummary[] | null>(null);
  const [sharedResult, setSharedResult] = useState<ResultParams | null>(null);

  useEffect(() => {
    const cid = window.location.pathname.split("/").pop()!;
    setCId(cid);
    const searchParams = new URLSearchParams(window.location.search);
    let brief: ChartBrief;
    if (process.env.NODE_ENV === "development") {
      brief = dummyBrief;
    } else {
      brief = JSON.parse(
        document
          .querySelector('meta[name="nikochanSharingBrief"]')!
          .getAttribute("content")!
      );
    }
    setBrief(brief);
    document.title = titleShare(t, cid, brief);
    setRecord(null);
    fetch(process.env.BACKEND_PREFIX + `/api/record/${cid}`)
      .then((res) => {
        if (res.ok) {
          res.json().then((record) => setRecord(record));
        } else {
          throw new Error("failed to fetch record");
        }
      })
      .catch(() => setRecord([]));
    if (searchParams.get("result")) {
      try {
        setSharedResult(deserializeResultParams(searchParams.get("result")!));
      } catch (e) {
        console.error(e);
      }
    }
  }, [t]);

  const [aboutPageIndex, setAboutPageIndex] = useState<number | null>(null);

  return (
    <main className="w-full h-full overflow-x-clip overflow-y-auto ">
      {aboutPageIndex !== null && (
        <AboutModal
          contents={props.aboutContents}
          aboutPageIndex={aboutPageIndex}
          setAboutPageIndex={setAboutPageIndex}
        />
      )}
      <div className="flex flex-col w-full min-h-full items-center ">
        <Link
          href={`/${locale}`}
          className={"w-full grow-3 shrink-0 basis-24 relative " + linkStyle1}
          style={{
            marginLeft: "-20rem",
            marginRight: "-20rem",
          }}
          prefetch={!process.env.NO_PREFETCH}
        >
          <Title className="absolute inset-0 " anim />
        </Link>
        <div className="basis-0 flex-1" />
        <div className="flex-none mb-3 text-center px-6">
          {tm("description")}
          <Link
            href={`/${locale}/main/about/1`}
            className={"main-wide:hidden " + linkStyle3}
          >
            {tm("about.title")}
          </Link>
          <button
            className={"hidden main-wide:inline " + linkStyle3}
            onClick={() => setAboutPageIndex(1)}
          >
            {tm("about.title")}
          </button>
        </div>
        <RedirectedWarning />
        <div
          className={
            "basis-auto grow-6 shrink min-h-0 w-full px-3 main-wide:px-6 " +
            "flex flex-col items-center justify-center"
          }
        >
          <Box className="w-max h-max max-w-full p-6">
            <ShareBox
              cid={cid}
              brief={brief}
              record={record}
              sharedResult={sharedResult}
              locale={locale}
              forceShowCId
            />
          </Box>
        </div>
        <div className="flex-none basis-15 main-wide:hidden " />
        <PCFooter locale={locale} nav />
      </div>
      <div
        className={
          "fixed bottom-0 inset-x-0 backdrop-blur-2xs " +
          "bg-gradient-to-t from-30% from-sky-50 to-sky-50/0 " +
          "dark:from-orange-950 dark:to-orange-950/0 "
        }
      >
        <MobileFooter locale={locale} tabKey={null} />
      </div>
    </main>
  );
}
