import clsx from "clsx/lite";
import Button, { buttonStyle } from "@/common/button.js";
import Input from "@/common/input.js";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId.js";
import { ChangeEvent, useEffect, useState } from "react";
import { ChartEdit, lastHashChangeVer, lastIncompatibleVer } from "@falling-nikochan/chart";
import { initSession, SessionData } from "@/play/session.js";
import { ExternalLink } from "@/common/extLink.js";
import ProgressBar from "@/common/progressBar.js";
import CheckBox from "@/common/checkBox.js";
import Caution from "@icon-park/react/lib/icons/Caution.js";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";
import { chartMaxEvent } from "@falling-nikochan/chart";
import { useShareLink } from "@/common/shareLinkAndImage";
import { isStandalone } from "@/common/pwaInstall";
import { useRouter } from "next/navigation";
import { useChartFile } from "./file";
import { useDisplayMode } from "@/scale.js";

interface Props {
  chart?: ChartEdit;
  setChart: (chart: ChartEdit) => void;
  savePasswd: boolean;
  setSavePasswd: (b: boolean) => void;
  newPasswd: string;
  setNewPasswd: (pw: string) => void;
}
export function MetaEdit(props: Props) {
  const t = useTranslations("edit.meta");
  const [hidePasswd, setHidePasswd] = useState<boolean>(true);

  return (
    <>
      <p className="mb-2">
        <span className="w-max">{t("youtubeId")}</span>
        <HelpIcon>{t.rich("youtubeIdHelp", { br: () => <br /> })}</HelpIcon>
        <Input
          className=""
          actualValue={props.chart?.ytId || ""}
          updateValue={(v: string) => {
            if (props.chart) {
              const ytId = getYouTubeId(v);
              props.setChart({
                ...props.chart,
                ytId,
                published: ytId ? props.chart.published : false,
              });
            }
          }}
          isValid={checkYouTubeId}
          left
        />
      </p>
      <p>{t("musicInfo")}</p>
      <p className="ml-2">
        <span className="inline-block w-max">{t("musicTitle")}</span>
        <Input
          className="font-title shrink w-80 max-w-full "
          actualValue={props.chart?.title || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, title: v })
          }
          left
        />
      </p>
      <p className="ml-2 ">
        <span className="inline-block w-max">{t("musicComposer")}</span>
        <Input
          className="text-sm font-title shrink w-80 max-w-full"
          actualValue={props.chart?.composer || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, composer: v })
          }
          left
        />
      </p>
      <p className="ml-2 mb-2">
        <span className="inline-block w-max">{t("chartCreator")}</span>
        <Input
          className="font-title shrink w-40 max-w-full"
          actualValue={props.chart?.chartCreator || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, chartCreator: v })
          }
          left
        />
      </p>
      <p className="">
        <span className="inline-block w-max">{t("passwd")}</span>
        <HelpIcon>{t.rich("passwdHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-flex flex-row items-baseline">
          <Input
            className="font-title shrink w-40 "
            actualValue={props.newPasswd}
            updateValue={props.setNewPasswd}
            left
            passwd={hidePasswd}
          />
          <Button
            text={t("displayPasswd")}
            onClick={() => setHidePasswd(!hidePasswd)}
          />
        </span>
        <CheckBox
          value={props.savePasswd}
          onChange={props.setSavePasswd}
          className="ml-2"
        >
          {t("savePasswd")}
        </CheckBox>
        <HelpIcon>{t.rich("savePasswdHelp", { br: () => <br /> })}</HelpIcon>
      </p>
    </>
  );
}

interface Props2 {
  saveEditSession: () => void;
  sessionId?: number;
  sessionData?: SessionData;
  chartNumEvent: number;
  chart?: ChartEdit;
  setChart: (chart: ChartEdit) => void;
  convertedFrom: number;
  setConvertedFrom: (c: number) => void;
  cid: string | undefined;
  setCid: (cid: string) => void;
  hasChange: boolean;
  setHasChange: (h: boolean) => void;
  currentLevelIndex: number;
  locale: string;
  savePasswd: boolean;
  setSavePasswd: (b: boolean) => void;
  currentPasswd: { current: string | null };
  newPasswd: string;
  setNewPasswd: (pw: string) => void;
}
export function MetaTab(props: Props2) {
  const t = useTranslations("edit.meta");
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const shareLink = useShareLink(props.cid, props.chart, props.locale);
  useEffect(() => {
    setErrorMsg("");
    setSaveMsg("");
  }, [props.chart]);
  const hasLevelData =
    props.chart?.levels &&
    props.chart.levels.length > 0 &&
    props.chart.levels.some((l) => l.notes.length > 0 && !l.unlisted);
  const { isTouch } = useDisplayMode();

  const { remoteSave, remoteDelete, downloadExtension, localSave, load } =
    useChartFile({
      cid: props.cid,
      chart: props.chart,
      savePasswd: props.savePasswd,
      currentPasswd: props.currentPasswd,
      locale: props.locale,
    });
  const save = async () => {
    setSaving(true);
    props.chart!.changePasswd =
      props.newPasswd.length > 0 ? props.newPasswd : null;
    const result = await remoteSave();
    if (result.isError) {
      setErrorMsg(result.message || "");
    } else {
      setErrorMsg(result.message || "");
      props.setCid(result.cid!);
      history.replaceState(
        null,
        "",
        `/${props.locale}/edit?cid=${result.cid!}`
      );
      props.setHasChange(false);
      props.setConvertedFrom(props.chart!.ver);
      if (props.chart!.changePasswd) {
        props.currentPasswd.current = props.chart!.changePasswd;
      }
    }
    props.chart!.changePasswd = null;
    setSaving(false);
  };
  const deleteChart = async () => {
    while (true) {
      const m = window.prompt(t("confirmDelete", { cid: props.cid! }));
      if (m === null) {
        return;
      }
      if (m === props.cid) {
        break;
      }
    }
    await remoteDelete();
  };
  const download = () => {
    const result = localSave();
    setSaveMsg(result.message || "");
  };
  const upload = async (e: ChangeEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length >= 1) {
      const f = target.files[0];
      const buffer = await f.arrayBuffer();
      target.value = "";
      setUploadMsg("");
      const result = await load(buffer);
      if (result.isError) {
        setUploadMsg(result.message || "");
      } else {
        props.setChart(result.chart!);
        props.setConvertedFrom(result.originalVer!);
      }
    }
  };

  return (
    <>
      <div className="mb-2">
        <span className="">{t("eventNum")}:</span>
        <span className="inline-block">
          <span className="ml-1">{props.chartNumEvent}</span>
          <span className="ml-1 text-sm ">/</span>
          <span className="ml-1 text-sm ">{chartMaxEvent}</span>
        </span>
        <HelpIcon>{t.rich("eventNumHelp", { br: () => <br /> })}</HelpIcon>
        <ProgressBar value={props.chartNumEvent / chartMaxEvent} />
      </div>
      <div className="mb-1">
        <ExternalLink
          onClick={() => {
            if (props.sessionData) {
              initSession(props.sessionData, props.sessionId);
              if (isStandalone()) {
                props.saveEditSession();
                router.push(`/${props.locale}/play?sid=${props.sessionId}`);
              } else {
                window
                  .open(
                    `/${props.locale}/play?sid=${props.sessionId}`,
                    "_blank"
                  )
                  ?.focus();
              }
            }
          }}
        >
          {t("testPlay")}
        </ExternalLink>
        <HelpIcon>{t.rich("testPlayHelp", { br: () => <br /> })}</HelpIcon>
      </div>
      <div className="">
        <span className="inline-block">
          {t("chartId")}:
          <span className="ml-1 mr-2 ">{props.cid || t("unsaved")}</span>
        </span>
        <HelpIcon>{t.rich("saveToServerHelp", { br: () => <br /> })}</HelpIcon>
        <Button
          text={t("saveToServer")}
          onClick={save}
          loading={saving}
          disabled={!props.chart?.ytId || (!props.cid && !props.newPasswd)}
        />
        <span className="inline-block ml-1 ">
          {errorMsg
            ? errorMsg
            : !props.chart?.ytId
              ? t("saveFail.noId")
              : !props.cid && !props.newPasswd
                ? t("saveFail.noPasswd")
                : null}
        </span>
        {props.hasChange && (
          <span className="inline-block ml-1 text-amber-600 ">
            {t("hasUnsaved")}
          </span>
        )}
        {
          /*props.convertedFrom < currentChartVer*/
          props.convertedFrom <= lastIncompatibleVer ? (
            <span className="inline-block ml-1 text-amber-600 text-sm ">
              <Caution className="inline-block mr-1 translate-y-0.5 " />
              {t("convertingIncompatible", { ver: props.convertedFrom })}
            </span>
          ) : (
            props.convertedFrom <= lastHashChangeVer && (
              <span className="inline-block ml-1 text-amber-600 text-sm ">
                <Caution className="inline-block mr-1 translate-y-0.5 " />
                {t("convertingHashChange", { ver: props.convertedFrom })}
              </span>
            )
          )
        }
      </div>
      {props.cid && (
        <>
          <div className="ml-2">
            <span className="hidden edit-wide:inline-block mr-2">
              {t("shareLink")}:
            </span>
            <ExternalLink href={shareLink.path}>
              <span className="edit-wide:hidden">{t("shareLink")}</span>
              <span className="hidden edit-wide:inline text-sm">
                {shareLink.url}
              </span>
            </ExternalLink>
            <span className="inline-block ml-2 space-x-1">
              {shareLink.toClipboard && (
                <Button text={t("copy")} onClick={shareLink.toClipboard} />
              )}
              {shareLink.toAPI && (
                <Button text={t("share")} onClick={shareLink.toAPI} />
              )}
            </span>
          </div>
        </>
      )}
      <p className="mb-2 ml-2 ">
        <CheckBox
          className="ml-0 "
          value={props.chart?.published || false}
          onChange={(v: boolean) =>
            props.chart && props.setChart({ ...props.chart, published: v })
          }
          disabled={!hasLevelData || !props.chart?.ytId}
        >
          {t("publish")}
        </CheckBox>
        <HelpIcon>{t.rich("publishHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-block ml-2 text-sm">
          {!props.chart?.ytId
            ? t("publishFail.noId")
            : !hasLevelData
              ? t("publishFail.empty")
              : null}
        </span>
      </p>
      <p>
        <Button
          text={t("deleteFromServer")}
          onClick={deleteChart}
          disabled={!props.cid}
        />
      </p>

      <div className="mb-4">
        <div>
          <span className="">{t("localSaveLoad")}</span>
          <HelpIcon>
            {t.rich("localSaveLoadHelp", {
              br: () => <br />,
              extension: downloadExtension,
            })}
          </HelpIcon>
          <span className="inline-block ml-1">
            <Button text={t("saveToLocal")} onClick={download} />
            <label
              className={clsx(buttonStyle, "inline-block")}
              htmlFor="upload-bin"
            >
              {t("loadFromLocal")}
            </label>
            <span className="inline-block ml-1">{saveMsg || uploadMsg}</span>
            <input
              type="file"
              className="hidden"
              id="upload-bin"
              name="upload-bin"
              onChange={upload}
            />
          </span>
        </div>
        {!isTouch && <div className="ml-2">{t("dragDropPossible")}</div>}
      </div>
      <MetaEdit
        {...props}
        savePasswd={props.savePasswd}
        setSavePasswd={props.setSavePasswd}
      />
    </>
  );
}
