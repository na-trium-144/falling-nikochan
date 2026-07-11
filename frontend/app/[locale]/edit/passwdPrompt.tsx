import Button from "@/common/button";
import CheckBox from "@/common/checkBox";
import Input from "@/common/input";
import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FetchChartOptions, LoadState } from "./chartState";
import { SlimeSVG } from "@/common/slime";
import { rateLimit } from "@falling-nikochan/chart";
import { APIError, shouldHideStatus } from "@/common/apiError";
import {
  ClientErrorTitle,
  ErrorMessage,
  LinksOnError,
} from "@/common/errorPageComponent";
import {
  historyBackWithReview,
  useInsideFrameDetector,
  useStandaloneDetector,
} from "@/common/pwaInstall";
import { formatErrorMsg } from "@/common/fetch";

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
  const standalone = useStandaloneDetector();
  const insideFrame = useInsideFrameDetector();

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
  } else if (props.loadStatus instanceof Error) {
    return (
      <>
        {props.loadStatus instanceof APIError ? (
          <>
            {!shouldHideStatus(props.loadStatus.status) && (
              <h4 className="fn-heading-box">
                Error {props.loadStatus.status}
              </h4>
            )}
            <p className="mb-3">{formatErrorMsg(props.loadStatus, te)}</p>
          </>
        ) : (
          <>
            <ClientErrorTitle />
            <ErrorMessage error={props.loadStatus} />
          </>
        )}
        <LinksOnError
          dependOnStatus={
            props.loadStatus instanceof APIError
              ? props.loadStatus.status
              : undefined
          }
        />
        {(standalone || insideFrame) && (
          <p>
            <Button text={t("back")} onClick={historyBackWithReview} />
          </p>
        )}
      </>
    );
  } else {
    props.loadStatus satisfies
      | "passwdFailed"
      | "passwdFailedSilent"
      | "rateLimited";
    return (
      <>
        <h4 className="fn-heading-box">
          <span className="">{t("chartId")}:</span>
          <span className="ml-2 ">{cid}</span>
        </h4>
        <div className="mb-3">
          <p>{t("enterPasswd")}</p>
          {props.loadStatus === "passwdFailed" && <p>{t("passwdFailed")}</p>}
          {props.loadStatus === "rateLimited" && (
            <p>{t("tooManyRequestWithSec", { sec: rateLimit.chartFile })}</p>
          )}
        </div>
        <div className="mb-1">
          <Input
            ref={passwdRef}
            actualValue={editPasswd}
            updateValue={setEditPasswd}
            left
            passwd
            onEnter={(editPasswd) =>
              props.fetchChart(cid, {
                editPasswd,
                savePasswd: props.savePasswd,
              })
            }
          />
          <Button
            text={t("submitPasswd")}
            onClick={() =>
              props.fetchChart(cid, {
                editPasswd,
                savePasswd: props.savePasswd,
              })
            }
          />
        </div>
        <div className="mb-2">
          <CheckBox
            id="save-passwd"
            value={props.savePasswd}
            onChange={props.setSavePasswd}
          >
            {t("savePasswd")}
          </CheckBox>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mb-2">
            <button
              className={clsx("fn-link-1", "w-max m-auto")}
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
        {(standalone || insideFrame) && (
          <p>
            <Button text={t("back")} onClick={historyBackWithReview} />
          </p>
        )}
      </>
    );
  }
}
