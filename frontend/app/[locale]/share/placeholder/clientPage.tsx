"use client";

import clsx from "clsx/lite";
import {
  ChartBrief,
  deserializeResultParams,
  RecordGetSummary,
  ResultParams,
} from "@falling-nikochan/chart";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { titleShare } from "@/common/title.js";
import { ShareBox } from "./shareBox.js";
import { Box } from "@/common/box.js";
import { RedirectedWarning } from "@/common/redirectedWarning.js";
import { TitleAsLink } from "@/common/titleLogo.jsx";
import { MobileFooter } from "@/common/footer.jsx";
import { APIError } from "@/common/apiError.js";
import { PCHeader2 } from "@/common/header.js";
import { Features, PoliciesAndLinks } from "@/clientPage.js";

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
    const titleUpdate = setInterval(() => {
      // Next.jsが元のタイトルに戻してしまう場合があるので、再度上書き
      if (document.title !== titleShare(t, cid, brief)) {
        document.title = titleShare(t, cid, brief);
      }
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
    return () => clearInterval(titleUpdate);
  }, [t]);

  return (
    <main
      className={clsx(
        "fn-body-scrollable",
        "flex flex-col items-center",
        "relative"
      )}
    >
      <PCHeader2 className="fixed top-0 right-0" locale={locale} backdropBlur />

      <TitleAsLink className="grow-3 shrink-0" locale={props.locale} />
      <RedirectedWarning />
      <div className="w-full max-w-main px-3 main-wide:px-6 grid-centering mb-12">
        <Box classNameOuter="w-full main-wide:w-max h-max max-w-full p-6">
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

      <Features locale={locale} />
      <div className="w-full max-w-main">
        <hr className="h-px w-3/4 my-12 mx-auto border-current/50" />
      </div>
      <PoliciesAndLinks locale={locale} />

      <div className="flex-none basis-mobile-footer no-pc" />
      <MobileFooter
        className="fixed bottom-0"
        blurBg
        locale={locale}
        tabKey={null}
      />
    </main>
  );
}
