"use client";

import { useState } from "react";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { CidSchema, rateLimitMin } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import { isStandalone } from "@/common/pwaInstall.js";
import { useRouter } from "next/navigation";

export default function EditTab({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");
  const te = useTranslations("error");
  const router = useRouter();

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
    <IndexMain
      title={t("title")}
      tabKey="edit"
      mobileTabKey="edit"
      locale={locale}
    >
      <p className="mb-3 text-justify">{t("welcome")}</p>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">{t("inputId")}:</span>
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
        </h3>
        <p className="pl-2 text-justify">{t("inputIdDesc")}</p>
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-bold font-title ">{t("new")}:</span>
          <ExternalLink className="ml-3" href={`/${locale}/edit?cid=new`}>
            {t("newButton")}
          </ExternalLink>
        </h3>
        <p className="pl-2 text-justify">{t("newDesc", { rateLimitMin })}</p>
      </div>
      <div className="mb-3">
        <h3 className="mb-2 text-xl font-bold font-title">{t("recentEdit")}</h3>
        <ChartList
          type="recentEdit"
          fetchAll
          href={(cid) => `/${locale}/edit?cid=${cid}`}
          newTab
          showLoading
          moreHref=""
        />
      </div>
    </IndexMain>
  );
}
