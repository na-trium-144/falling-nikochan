"use client";

import * as Sentry from "@sentry/nextjs";
import clsx from "clsx/lite";
import {
  ChartBrief,
  deserializeResultParams,
  RecordGetSummary,
  RecordGetSummarySchema,
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
import { PCHeader2 } from "@/common/header.js";
import { Features, PoliciesAndLinks } from "@/clientPage.js";
import { captureAndWrap, fetchBackend } from "@/common/fetch.js";
import * as v from "valibot";
import { etagContentRegex } from "@/common/briefCache.js";

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
  const [brief, setBrief] = useState<(ChartBrief & { etag: string }) | null>(
    null
  );
  const [record, setRecord] = useState<RecordGetSummary[] | Error | null>(null);
  const [sharedResult, setSharedResult] = useState<ResultParams | null>(null);

  useEffect(() => {
    const cid = window.location.pathname.split("/").pop()!;
    setCId(cid);
    const searchParams = new URLSearchParams(window.location.search);
    let brief: ChartBrief;
    let etag: string;
    if (process.env.NODE_ENV === "development") {
      brief = dummyBrief;
      etag = "";
    } else {
      brief = JSON.parse(
        document
          .querySelector('meta[name="nikochanSharingBrief"]')!
          .getAttribute("content")!
      );
      etag =
        document
          .querySelector('meta[name="nikochanSharingETag"]')!
          .getAttribute("content")
          ?.match(etagContentRegex)?.[0] ?? "";
    }
    setBrief({ ...brief, etag });
    document.title = titleShare(t, cid, brief);
    const titleUpdate = setInterval(() => {
      // Next.jsが元のタイトルに戻してしまう場合があるので、再度上書き
      if (document.title !== titleShare(t, cid, brief)) {
        document.title = titleShare(t, cid, brief);
      }
    }, 100);
    setRecord(null);
    fetchBackend()
      .get(`/api/record/${cid}`)
      .json((record) => v.parse(v.array(RecordGetSummarySchema()), record))
      .catch((e: unknown) => captureAndWrap(e, { cid }))
      .then((record) => setRecord(record));
    if (searchParams.get("result")) {
      try {
        setSharedResult(deserializeResultParams(searchParams.get("result")!));
      } catch (e) {
        console.error(e);
        Sentry.captureException(e);
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
      <RedirectedWarning className="mx-3 main-wide:mx-6 mb-2" />
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
      <hr className="fn-hr" />
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
