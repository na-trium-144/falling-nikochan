import Button from "@/common/button";
import CheckBox from "@/common/checkBox";
import Input from "@/common/input";
import { linkStyle1 } from "@/common/linkStyle";
import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FetchChartOptions, LoadState } from "./chartState";
import { SlimeSVG } from "@/common/slime";
import { rateLimit } from "@falling-nikochan/chart";
import { APIError } from "@/common/apiError";

interface PasswdProps {
  loadStatus: LoadState;
  fetchChart: (cid: string, options: FetchChartOptions) => Promise<void>;
  savePasswd: boolean;
  setSavePasswd: (s: boolean) => void;
}
export function PasswdPrompt(props: PasswdProps) {
  const t = useTranslations("edit");
  const passwdRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (passwdRef.current) {
      passwdRef.current.focus();
      passwdRef.current.select();
    }
  }, []);
  const [editPasswd, setEditPasswd] = useState<string>("");
  const te = useTranslations("error");

  const [cid, setCId] = useState<string>("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCId(params.get("cid") || "");
  }, []);

  if (props.loadStatus === "ok") {
    return null;
  } else if (props.loadStatus === "loading" || props.loadStatus === undefined) {
    return (
      <p>
        <SlimeSVG />
        Loading...
      </p>
    );
  } else if (props.loadStatus instanceof APIError) {
    return <p>{props.loadStatus.format(te)}</p>;
  } else {
    props.loadStatus satisfies
      | "passwdFailed"
      | "passwdFailedSilent"
      | "rateLimited";
    return (
      <div className="text-center ">
        <p className="mb-2 ">
          <span className="">{t("chartId")}:</span>
          <span className="ml-2 ">{cid}</span>
        </p>
        <p>{t("enterPasswd")}</p>
        {props.loadStatus === "passwdFailed" && <p>{t("passwdFailed")}</p>}
        {props.loadStatus === "rateLimited" && (
          <p>{t("tooManyRequestWithSec", { sec: rateLimit.chartFile })}</p>
        )}
        <Input
          ref={passwdRef}
          actualValue={editPasswd}
          updateValue={setEditPasswd}
          left
          passwd
          onEnter={(editPasswd) =>
            props.fetchChart(cid, { editPasswd, savePasswd: props.savePasswd })
          }
        />
        <Button
          text={t("submitPasswd")}
          onClick={() =>
            props.fetchChart(cid, { editPasswd, savePasswd: props.savePasswd })
          }
        />
        <div>
          <CheckBox
            id="save-passwd"
            value={props.savePasswd}
            onChange={props.setSavePasswd}
          >
            {t("savePasswd")}
          </CheckBox>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-2 ">
            <button
              className={clsx(linkStyle1, "w-max m-auto")}
              onClick={() =>
                props.fetchChart(cid, {
                  bypass: true,
                  editPasswd,
                  savePasswd: props.savePasswd,
                })
              }
            >
              {t("bypassPasswd")}
            </button>
          </div>
        )}
      </div>
    );
  }
}
