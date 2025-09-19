import clsx from "clsx/lite";
import Button, { buttonStyle } from "@/common/button.js";
import Input from "@/common/input.js";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId.js";
import { ChangeEvent, useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import {
  ChartEdit,
  ChartMin,
  convertToMin,
  lastHashChangeVer,
  lastIncompatibleVer,
  validateChartMin,
} from "@falling-nikochan/chart";
import { getPasswd, setPasswd, unsetPasswd } from "@/common/passwdCache.js";
import { addRecent } from "@/common/recent.js";
import { initSession, SessionData } from "@/play/session.js";
import { ExternalLink } from "@/common/extLink.js";
import ProgressBar from "@/common/progressBar.js";
import YAML from "yaml";
import CheckBox from "@/common/checkBox.js";
import Caution from "@icon-park/react/lib/icons/Caution.js";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";
import { luaExec } from "@falling-nikochan/chart/dist/luaExec";
import { chartMaxEvent } from "@falling-nikochan/chart";
import { useShareLink } from "@/common/shareLinkAndImage";
import { isStandalone, updatePlayCountForReview } from "@/common/pwaInstall";
import { useRouter } from "next/navigation";

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
  const te = useTranslations("error");
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

  const save = async () => {
    setSaving(true);
    const onSave = async (cid: string, changePasswd: string | null) => {
      setErrorMsg(t("saveDone"));
      props.setHasChange(false);
      props.setConvertedFrom(props.chart!.ver);
      if (changePasswd) {
        if (props.savePasswd) {
          try {
            fetch(
              process.env.BACKEND_PREFIX +
                `/api/hashPasswd/${cid}?p=${changePasswd}`,
              {
                credentials:
                  process.env.NODE_ENV === "development"
                    ? "include"
                    : "same-origin",
              }
            ).then(async (res) => {
              setPasswd(cid, await res.text());
            });
          } catch {
            //ignore
          }
        } else {
          unsetPasswd(cid);
        }
        props.currentPasswd.current = changePasswd;
      }
    };
    props.chart!.changePasswd =
      props.newPasswd.length > 0 ? props.newPasswd : null;
    if (props.cid === undefined) {
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX + `/api/newChartFile`,
          {
            method: "POST",
            body: msgpack.serialize(props.chart),
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res.ok) {
          try {
            const resBody = (await res.json()) as {
              message?: string;
              cid?: string;
            };
            if (typeof resBody.cid === "string") {
              props.setCid(resBody.cid);
              history.replaceState(
                null,
                "",
                `/${props.locale}/edit?cid=${resBody.cid}`
              );
              addRecent("edit", resBody.cid);
              updatePlayCountForReview();
              onSave(resBody.cid, props.chart!.changePasswd);
            } else {
              setErrorMsg(te("badResponse"));
            }
          } catch {
            setErrorMsg(te("badResponse"));
          }
        } else {
          try {
            const message = ((await res.json()) as { message?: string })
              .message;
            if (te.has("api." + message)) {
              setErrorMsg(te("api." + message));
            } else {
              setErrorMsg(message || te("unknownApiError"));
            }
          } catch {
            setErrorMsg(te("unknownApiError"));
          }
        }
      } catch (e) {
        console.error(e);
        setErrorMsg(te("api.fetchError"));
      }
    } else {
      const q = new URLSearchParams();
      if (props.currentPasswd.current) {
        q.set("p", props.currentPasswd.current);
      } else if (getPasswd(props.cid)) {
        q.set("ph", getPasswd(props.cid)!);
      }
      try {
        const res = await fetch(
          process.env.BACKEND_PREFIX +
            `/api/chartFile/${props.cid}?` +
            q.toString(),
          {
            method: "POST",
            body: msgpack.serialize(props.chart),
            cache: "no-store",
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        );
        if (res.ok) {
          props.setHasChange(false);
          onSave(props.cid, props.chart!.changePasswd);
        } else {
          try {
            const message = ((await res.json()) as { message?: string })
              .message;
            if (te.has("api." + message)) {
              setErrorMsg(te("api." + message));
            } else {
              setErrorMsg(message || te("unknownApiError"));
            }
          } catch {
            setErrorMsg(te("unknownApiError"));
          }
        }
      } catch (e) {
        console.error(e);
        setErrorMsg(te("api.fetchError"));
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
    const q = new URLSearchParams();
    if (props.currentPasswd.current) {
      q.set("p", props.currentPasswd.current);
    } else if (getPasswd(props.cid!)) {
      q.set("ph", getPasswd(props.cid!)!);
    }
    try {
      const res = await fetch(
        process.env.BACKEND_PREFIX +
          `/api/chartFile/${props.cid}?` +
          q.toString(),
        {
          method: "DELETE",
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
        }
      );
      if (res.ok) {
        if (isStandalone()) {
          history.back();
        } else {
          window.close();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  const downloadExtension = `fn${props.chart?.ver}.yml`;
  const download = () => {
    const yml = YAML.stringify(convertToMin(props.chart!), {
      indentSeq: false,
    });
    const filename = `${props.cid}_${props.chart?.title}.${downloadExtension}`;
    saveAs(new Blob([yml]), filename);
    setSaveMsg(`${t("saveDone")} (${filename})`);
  };
  const upload = async (e: ChangeEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length >= 1) {
      const f = target.files[0];
      const buffer = await f.arrayBuffer();
      setUploadMsg("");
      let originalVer: number = 0;
      let newChart: ChartEdit | null = null;
      try {
        const content: ChartMin = YAML.parse(new TextDecoder().decode(buffer));
        if (typeof content.ver === "number") {
          originalVer = content.ver;
        }
        const newChartMin = await validateChartMin(content);
        newChart = {
          ...newChartMin,
          changePasswd: null,
          published: false,
          levels: await Promise.all(
            newChartMin.levels.map(async (l) => ({
              ...l,
              ...(
                await luaExec(
                  process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
                  l.lua.join("\n"),
                  false
                )
              ).levelFreezed,
            }))
          ),
        };
      } catch (e1) {
        console.warn("fallback to msgpack deserialize");
        try {
          const content: ChartMin = msgpack.deserialize(buffer);
          if (typeof content.ver === "number") {
            originalVer = content.ver;
          }
          const newChartMin = await validateChartMin(content);
          newChart = {
            ...newChartMin,
            changePasswd: null,
            published: false,
            levels: await Promise.all(
              newChartMin.levels.map(async (l) => ({
                ...l,
                ...(
                  await luaExec(
                    process.env.ASSET_PREFIX + "/assets/wasmoon_glue.wasm",
                    l.lua.join("\n"),
                    false
                  )
                ).levelFreezed,
              }))
            ),
          };
        } catch (e2) {
          console.error(e1);
          console.error(e2);
          setUploadMsg(t("loadFail"));
        }
      }
      if (newChart) {
        if (confirm(t("confirmLoad"))) {
          props.setChart(newChart);
          props.setConvertedFrom(originalVer);
        }
      }
      target.value = "";
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
      <MetaEdit
        {...props}
        savePasswd={props.savePasswd}
        setSavePasswd={props.setSavePasswd}
      />
    </>
  );
}
