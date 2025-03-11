"use client";

import Header from "@/common/header.js";
import Footer from "@/common/footer.js";
import {
  ChartBrief,
  deserializeResultParams,
  ResultParams,
} from "@falling-nikochan/chart";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { titleShare } from "@/common/title.js";
import { ShareBox } from "./shareBox.js";
import { Box } from "@/common/box.js";
import { fetchBrief } from "@/common/briefCache.js";

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

export default function ShareChart({ locale }: { locale: string }) {
  const t = useTranslations("share");

  const [cid, setCId] = useState<string>("");
  // const { res, brief } = await getBrief(cid, true);
  const [brief, setBrief] = useState<ChartBrief | null>(null);
  const [sharedResult, setSharedResult] = useState<ResultParams | null>(null);

  useEffect(() => {
    const cid = window.location.pathname.split("/").pop()!;
    setCId(cid);
    const searchParams = new URLSearchParams(window.location.search);
    void (async () => {
      let brief: ChartBrief | undefined;
      if (process.env.NODE_ENV === "development") {
        brief = dummyBrief;
      } else {
        brief = (await fetchBrief(cid, true)).brief;
      }
      if (!brief) {
        throw new Error("Failed to fetch brief");
      }
      setBrief(brief);
      document.title = titleShare(t, cid, brief);
    })();
    if (searchParams.get("result")) {
      try {
        setSharedResult(deserializeResultParams(searchParams.get("result")!));
      } catch (e) {
        console.error(e);
      }
    }
  }, [t]);

  return (
    <main className="flex flex-col items-center w-full min-h-dvh h-max">
      <Header className="main-wide:hidden" locale={locale}>
        ID: {cid}
      </Header>
      <div className={"flex-1 p-6 w-full flex items-center justify-center"}>
        {brief !== null && (
          <Box
            className="m-auto max-w-full p-6 shrink"
            style={{ flexBasis: "60rem" }}
          >
            <ShareBox
              cid={cid}
              brief={brief}
              sharedResult={sharedResult}
              locale={locale}
            />
          </Box>
        )}
      </div>
      <Footer nav locale={locale} />
    </main>
  );
}
