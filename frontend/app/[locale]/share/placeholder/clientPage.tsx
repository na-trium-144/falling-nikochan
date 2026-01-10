"use client";

import clsx from "clsx/lite";
import {
  ChartBrief,
  deserializeResultParams,
  RecordGetSummary,
  ResultParams,
} from "@falling-nikochan/chart";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { titleShare } from "@/common/title.js";
import { ShareBox } from "./shareBox.js";
import { Box } from "@/common/box.js";
import { RedirectedWarning } from "@/common/redirectedWarning.js";
import Link from "next/link.js";
import Title from "@/common/titleLogo.jsx";
import { linkStyle1, linkStyle3 } from "@/common/linkStyle.js";
import { MobileFooter, PCFooter } from "@/common/footer.jsx";
import { AboutModal } from "@/common/aboutModal.jsx";
import { useDelayedDisplayState } from "@/common/delayedDisplayState.js";
import ArrowRight from "@icon-park/react/lib/icons/ArrowRight.js";

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
    const titleUpdate = setTimeout(() => {
      // Next.jsが元のタイトルに戻してしまう場合があるので、再度上書き
      document.title = titleShare(t, cid, brief);
    }, 100);
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
    return () => clearTimeout(titleUpdate);
  }, [t]);

  const [aboutPageIndex, setAboutPageIndex_] = useState<number | null>(null);
  const [aboutOpen, aboutAnim, setAboutOpen_] = useDelayedDisplayState(200);
  const setAboutPageIndex = useCallback(
    (i: number | null) => {
      setAboutOpen_(i !== null, () => setAboutPageIndex_(i));
    },
    [setAboutOpen_]
  );

  return (
    <main className="w-full h-full overflow-x-clip overflow-y-auto ">
      {aboutPageIndex !== null && aboutOpen && (
        <AboutModal
          aboutAnim={aboutAnim}
          aboutPageIndex={aboutPageIndex}
          setAboutPageIndex={setAboutPageIndex}
          locale={props.locale}
        />
      )}
      <div className="flex flex-col w-full min-h-full items-center ">
        <Link
          href={`/${locale}`}
          className={clsx(
            "w-full grow-3 shrink-0 basis-24 relative",
            linkStyle1
          )}
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
            className={clsx(
              "main-wide:hidden inline-block",
              "ml-2",
              linkStyle3
            )}
          >
            {tm("aboutNikochan")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </Link>
          <button
            className={clsx(
              "hidden main-wide:inline-block",
              "ml-2",
              linkStyle3
            )}
            onClick={() => setAboutPageIndex(1)}
          >
            {tm("aboutNikochan")}
            <ArrowRight
              className="inline-block align-middle ml-2 "
              theme="filled"
            />
          </button>
        </div>
        <RedirectedWarning />
        <div
          className={clsx(
            "basis-auto grow-6 shrink min-h-0 w-full px-3 main-wide:px-6",
            "flex flex-col items-center justify-center"
          )}
        >
          <Box classNameOuter="w-max h-max max-w-full p-6">
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
        className={clsx(
          "fixed bottom-0 inset-x-0 backdrop-blur-2xs",
          "bg-gradient-to-t from-30% from-sky-50 to-sky-50/0",
          "dark:from-orange-950 dark:to-orange-950/0"
        )}
      >
        <MobileFooter locale={locale} tabKey={null} />
      </div>
    </main>
  );
}
