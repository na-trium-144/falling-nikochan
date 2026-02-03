"use client";

import clsx from "clsx/lite";
import { useEffect, useState } from "react";
import { IndexMain } from "../main.js";
import Input from "@/common/input.js";
import { ChartList } from "../chartList.js";
import { ExternalLink } from "@/common/extLink.js";
import { CidSchema, rateLimit } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import * as v from "valibot";
import { SlimeSVG } from "@/common/slime.js";
import { detectOS, isStandalone } from "@/common/pwaInstall.js";
import { useRouter } from "next/navigation";
import Youtube from "@icon-park/react/lib/icons/Youtube.js";
import Caution from "@icon-park/react/lib/icons/Caution.js";
import { APIError } from "@/common/apiError.js";

export default function EditTab({ locale }: { locale: string }) {
  const t = useTranslations("main.edit");
  const te = useTranslations("error");
  const router = useRouter();

  const [isSafari, setIsSafari] = useState<boolean>(false);
  useEffect(() => {
    setIsSafari(detectOS() === "ios" || navigator.vendor.includes("Apple"));
  }, []);

  const [cidErrorMsg, setCIdErrorMsg] = useState<APIError>();
  const [cidFetching, setCidFetching] = useState<boolean>(false);
  const [inputCId, setInputCId] = useState<string>("");
  const gotoCId = async (cid: string) => {
    setCIdErrorMsg(undefined);
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
        setCIdErrorMsg(undefined);
        setInputCId(cid);
      } else {
        setCIdErrorMsg(await APIError.fromRes(res));
        setInputCId("");
      }
    } catch (e) {
      console.error(e);
      setCidFetching(false);
      setCIdErrorMsg(APIError.fetchError());
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
        >
          <Youtube className="inline-block mr-1 align-middle" theme="filled" />
          <span className="text-sm">{t("howToVideo")}</span>
        </ExternalLink>
      </p>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-semibold font-title ">
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
            className={clsx("ml-1", inputCId !== "" || "hidden!")}
            // use encodeURIComponent to silence CodeQL false positive alert
            href={`/${locale}/edit?cid=${encodeURIComponent(inputCId)}`}
          >
            {t("newTab")}
          </ExternalLink>
          <span className={clsx(cidFetching ? "inline-block" : "hidden")}>
            <SlimeSVG />
            Loading...
          </span>
          <span className="ml-1 inline-block">{cidErrorMsg?.format(te)}</span>
        </h3>
        <p className="pl-2 text-justify">{t("inputIdDesc")}</p>
      </div>
      <div className="mb-3">
        <h3 className="mb-2">
          <span className="text-xl font-semibold font-title ">{t("new")}:</span>
          <ExternalLink className="ml-3" href={`/${locale}/edit?cid=new`}>
            {t("newButton")}
          </ExternalLink>
        </h3>
        <p className="pl-2 text-justify">
          {t("newDesc", { rateLimitMin: rateLimit.newChartFile / 60 })}
        </p>
      </div>
      <div className="mb-3">
        <h3 className="mb-2 text-xl font-semibold font-title">
          {t("recentEdit")}
        </h3>
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
