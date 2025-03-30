"use client";

import { useCallback, useEffect, useState } from "react";
import { getRecent, updateRecent } from "@/common/recent.js";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { AccordionLike, ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import {
  ChartLineBrief,
  chartListMaxRow,
  fetchAndFilterBriefs,
} from "../play/fetch.js";
import { CidSchema, rateLimitMin } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useDisplayMode } from "@/scale.js";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import { isStandalone } from "@/common/pwaInstall.js";
import { useRouter } from "next/navigation";

export default function EditTab({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");
  const te = useTranslations("error");
  const router = useRouter();
  const { isMobileMain } = useDisplayMode();

  const [recentBrief, setRecentBrief] = useState<ChartLineBrief[]>();
  const [fetchRecentAll, setFetchRecentAll] = useState<boolean>(false);

  const [showExclusiveMode, setShowExclusiveMode] = useState<null | "recent">(
    null,
  );
  const [showAllMode, setShowAllMode] = useState<null | "recent">(null);
  const goExclusiveMode = useCallback(
    (mode: "recent") => {
      window.history.replaceState(null, "", "#"); // これがないとなぜか #recent から元のページにブラウザバックできなくなる場合があるけどなぜ?
      window.history.pushState(null, "", "#" + mode);
      setShowExclusiveMode(mode);
      if (isMobileMain) {
        setShowAllMode(mode);
        window.scrollTo(0, 0);
      } else {
        setTimeout(() => setShowAllMode(mode), 200);
      }
    },
    [isMobileMain],
  );
  // modalのcloseと、exclusiveModeのリセットは window.history.back(); でpopstateイベントを呼び出しその中で行われる
  useEffect(() => {
    const handler = () => {
      if (window.location.hash.length >= 2) {
        goExclusiveMode(window.location.hash.slice(1) as "recent");
      } else {
        setShowAllMode(null);
        setShowExclusiveMode(null);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [goExclusiveMode]);

  useEffect(() => {
    const recentCId = getRecent("edit").reverse();
    setRecentBrief(recentCId.map((cid) => ({ cid, fetched: false })));
  }, []);
  useEffect(() => {
    void (async () => {
      if (recentBrief) {
        const { changed, briefs } = await fetchAndFilterBriefs(
          recentBrief,
          fetchRecentAll,
        );
        if (changed) {
          setRecentBrief(briefs);
          updateRecent("edit", briefs.map(({ cid }) => cid).reverse());
        }
      }
    })();
  }, [recentBrief, fetchRecentAll]);

  const [cidErrorMsg, setCIdErrorMsg] = useState<string>("");
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const [inputCId, setInputCId] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg("");
    setCidFetching(true);
    try {
      const res = await fetch(
        process.env.BACKEND_PREFIX + `/api/brief/${cid}`,
        {
          cache: "no-store",
        },
      );
      setCidFetching(false);
      if (res.ok) {
        if (isStandalone()) {
          router.push(`/${locale}/edit?cid=${cid}`);
        } else {
          window.open(`/${locale}/edit?cid=${cid}`, "_blank")?.focus(); // これで新しいタブが開かない場合がある
        }
        setCIdErrorMsg("");
        setInputCId(cid);
      } else {
        try {
          const message = ((await res.json()) as { message?: string }).message;
          if (te.has("api." + message)) {
            setCIdErrorMsg(te("api." + message));
          } else {
            setCIdErrorMsg(message || te("unknownApiError"));
          }
        } catch {
          setCIdErrorMsg(te("unknownApiError"));
        }
        setInputCId("");
      }
    } catch (e) {
      console.error(e);
      setCidFetching(false);
      setCIdErrorMsg(te("fetchError"));
      setInputCId("");
    }
  };

  return (
    <IndexMain tab={2} locale={locale}>
      <AccordionLike hidden={showExclusiveMode !== null}>
        <p className="mb-3 text-justify">{t("welcome")}</p>
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null}
        header={
          <>
            <span className="text-xl font-bold font-title ">
              {t("inputId")}:
            </span>
            <Input
              className="ml-4 w-20"
              actualValue={inputCId}
              updateValue={gotoCId}
              updateInvalidValue={() => setInputCId("")}
              isValid={(t) => v.safeParse(CidSchema(), t).success}
              left
            />
            <ExternalLink
              className={"ml-1 " + (inputCId !== "" ? "" : "hidden! ")}
              href={`/${locale}/edit?cid=${inputCId}`}
            >
              {t("newTab")}
            </ExternalLink>
            <span className={cidFetching ? "inline-block " : "hidden "}>
              <SlimeSVG />
              Loading...
            </span>
            <span className="ml-1 inline-block">{cidErrorMsg}</span>
          </>
        }
      >
        <p className="pl-2 text-justify">{t("inputIdDesc")}</p>
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null && showExclusiveMode !== "recent"}
        expanded={showAllMode === "recent"}
        reset={() => window.history.back()}
        header={
          <span className="text-xl font-bold font-title">
            {t("recentEdit")}
          </span>
        }
      >
        <ChartList
          recentBrief={recentBrief}
          maxRow={chartListMaxRow}
          fetchAdditional={() => setFetchRecentAll(true)}
          href={(cid) => `/${locale}/edit?cid=${cid}`}
          newTab
          showLoading
          additionalOpen={showAllMode === "recent"}
          setAdditionalOpen={(open) => {
            if (open) {
              goExclusiveMode("recent");
            } else {
              window.history.back();
            }
          }}
        />
      </AccordionLike>
      <AccordionLike
        hidden={showExclusiveMode !== null}
        header={
          <>
            <span className="text-xl font-bold font-title ">{t("new")}:</span>
            <ExternalLink className="ml-3" href={`/${locale}/edit?cid=new`}>
              {t("newButton")}
            </ExternalLink>
          </>
        }
      >
        <p className="pl-2 text-justify">{t("newDesc", { rateLimitMin })}</p>
      </AccordionLike>
    </IndexMain>
  );
}
