"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { CidSchema, rateLimitMin } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import { detectOS, isStandalone } from "@/common/pwaInstall.js";
import { useRouter } from "next/navigation";
import Youtube from "@icon-park/react/lib/icons/Youtube.js";
import Caution from "@icon-park/react/lib/icons/Caution.js";

export default function EditTab({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");
  const te = useTranslations("error");
  const router = useRouter();

  const [isSafari, setIsSafari] = useState<boolean>(false);
  useEffect(() => {
    setIsSafari(detectOS() === "ios" || navigator.vendor.includes("Apple"));
  }, []);

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
        }
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
      setCIdErrorMsg(te("api.fetchError"));
      setInputCId("");
    }
  };

  return (
    <IndexMain
      title={t("title")}
      tabKey="edit"
      mobileTabKey="edit"
      noBackButtonMobile
      noBackButtonPC
      locale={locale}
    >
      <p className="text-justify">{t("welcome")}</p>
      <p className="mb-3 text-left">
        {t("welcome2")}
        <ExternalLink
          className="mx-1"
          href="https://www.youtube.com/watch?v=hi9TY_78ETY"
          icon={<Youtube className="absolute left-0 bottom-1" theme="filled" />}
        >
          <span className="text-sm">{t("howToVideo")}</span>
        </ExternalLink>
      </p>
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
            className={clsx("ml-1", inputCId !== "" ? "" : "hidden!")}
            href={`/${locale}/edit?cid=${inputCId}`}
          >
            {t("newTab")}
          </ExternalLink>
          <span className={clsx(cidFetching ? "inline-block" : "hidden")}>
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
        {isSafari && (
          <p className="pl-2 mb-1 text-justify">
            <Caution className="inline-block mr-1 translate-y-0.5 " />
            {t("safariLSWarning")}
          </p>
        )}
        <ChartList
          type="recentEdit"
          fetchAll
          href={(cid) => `/${locale}/edit?cid=${cid}`}
          newTab
          showLoading
          moreHref={null}
        />
      </div>
    </IndexMain>
  );
}
