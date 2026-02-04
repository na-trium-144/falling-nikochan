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
import { TitleAsLink } from "@/common/titleLogo.jsx";
import { MobileFooter, PCFooter } from "@/common/footer.jsx";
import { AboutModal } from "@/common/aboutModal.jsx";
import { useDelayedDisplayState } from "@/common/delayedDisplayState.js";
import { AboutDescription } from "@/main/main.jsx";
import { APIError } from "@/common/apiError.js";

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
  const { locale } = props;
  const [cid, setCId] = useState<string>("");
  // const { res, brief } = await getBrief(cid, true);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [record, setRecord] = useState<RecordGetSummary[] | APIError | null>(
    null
  );
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
    (async () => {
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX + `/api/record/${cid}`
        );
        if (res.ok) {
          try {
            setRecord(await res.json());
          } catch (e) {
            console.error(e);
            setRecord(APIError.badResponse());
          }
        } else {
          setRecord(await APIError.fromRes(res));
        }
      } catch {
        setRecord(APIError.fetchError());
      }
    })();
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
        <TitleAsLink className="grow-3 shrink-0" locale={props.locale} />
        <div className="basis-0 flex-1" />
        <AboutDescription
          className="mb-3 px-6"
          locale={locale}
          onClickAbout={() => setAboutPageIndex(1)}
        />
        <RedirectedWarning />
        <div
          className={clsx(
            "basis-auto grow-6 shrink min-h-0 w-full px-3 main-wide:px-6",
            "flex flex-row items-center justify-center"
          )}
        >
          <Box classNameOuter="w-max h-max max-w-main p-6">
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
        <div className="flex-none basis-mobile-footer no-pc" />
        <PCFooter locale={locale} nav />
      </div>
      <MobileFooter
        className="fixed bottom-0"
        blurBg
        locale={locale}
        tabKey={null}
      />
    </main>
  );
}
