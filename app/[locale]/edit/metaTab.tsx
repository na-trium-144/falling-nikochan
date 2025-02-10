import Button, { buttonStyle } from "@/common/button.js";
import Input from "@/common/input.js";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId.js";
import { ChangeEvent, useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import {
  Chart,
  chartMaxSize,
  currentChartVer,
  validateChart,
} from "@/../../chartFormat/chart.js";
import {
  getPasswd,
  getV6Passwd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache.js";
import { addRecent } from "@/common/recent.js";
import { initSession, SessionData } from "@/play/session.js";
import { ExternalLink } from "@/common/extLink.js";
import ProgressBar from "@/common/progressBar.js";
import YAML from "yaml";
import CheckBox from "@/common/checkBox.js";
import { Caution } from "@icon-park/react";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
  savePasswd: boolean;
  setSavePasswd: (b: boolean) => void;
}
export function MetaEdit(props: Props) {
  const t = useTranslations("edit.meta");
  const [hidePasswd, setHidePasswd] = useState<boolean>(true);
  const hasLevelData =
    props.chart?.levels &&
    props.chart.levels.length > 0 &&
    props.chart.levels.some((l) => l.notes.length > 0 && !l.unlisted);

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
            actualValue={props.chart?.editPasswd || ""}
            updateValue={(v: string) =>
              props.chart &&
              props.setChart({
                ...props.chart,
                editPasswd: v,
                published: v ? props.chart.published : false,
              })
            }
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
      <p>
        <CheckBox
          className="ml-0 "
          value={props.chart?.published || false}
          onChange={(v: boolean) =>
            props.chart && props.setChart({ ...props.chart, published: v })
          }
          disabled={
            !props.chart?.editPasswd || !hasLevelData || !props.chart?.ytId
          }
        >
          {t("publish")}
        </CheckBox>
        <HelpIcon>{t.rich("publishHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-block ml-2 text-sm">
          {!props.chart?.ytId
            ? t("publishFail.noId")
            : !hasLevelData
            ? t("publishFail.empty")
            : !props.chart?.editPasswd && t("publishFail.noPasswd")}
        </span>
      </p>
    </>
  );
}

interface Props2 {
  sessionId?: number;
  sessionData?: SessionData;
  fileSize: number;
  chart?: Chart;
  setChart: (chart: Chart) => void;
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
  editPasswdPrev: string;
  setEditPasswdPrev: (s: string) => void;
}
export function MetaTab(props: Props2) {
  const t = useTranslations("edit.meta");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  useEffect(() => {
    setErrorMsg("");
    setSaveMsg("");
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, [props.chart]);

  const save = async () => {
    setSaving(true);
    const onSave = async (cid: string, editPasswd: string) => {
      setErrorMsg(t("saveDone"));
      props.setHasChange(false);
      props.setConvertedFrom(props.chart!.ver);
      if (props.savePasswd) {
        fetch(
          process.env.BACKEND_PREFIX +
            `/api/hashPasswd/${cid}?pw=${editPasswd}`,
          {
            credentials:
              process.env.NODE_ENV === "development"
                ? "include"
                : "same-origin",
          }
        ).then(async (res) => {
          setPasswd(cid, await res.text());
        });
      } else {
        unsetPasswd(cid);
      }
      props.setEditPasswdPrev(editPasswd);
    };
    if (props.cid === undefined) {
      const res = await fetch(
        process.env.BACKEND_PREFIX + `/api/newChartFile`,
        {
          method: "POST",
          body: msgpack.serialize(props.chart),
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
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
            history.replaceState(null, "", `/${props.locale}/edit?cid=${resBody.cid}`);
            addRecent("edit", resBody.cid);
            onSave(resBody.cid, props.chart!.editPasswd);
          } else {
            setErrorMsg("Invalid response");
          }
        } catch {
          setErrorMsg("Invalid response");
        }
      } else {
        try {
          const resBody = (await res.json()) as {
            message?: string;
            cid?: string;
          };
          setErrorMsg(`${res.status}: ${resBody.message}`);
        } catch {
          setErrorMsg(`${res.status} Error`);
        }
      }
    } else {
      const res = await fetch(
        process.env.BACKEND_PREFIX +
          `/api/chartFile/${props.cid}` +
          `?p=${getV6Passwd(props.cid)}` +
          `&ph=${getPasswd(props.cid)}` +
          `&pw=${props.editPasswdPrev}`,
        {
          method: "POST",
          body: msgpack.serialize(props.chart),
          cache: "no-store",
          credentials:
            process.env.NODE_ENV === "development" ? "include" : "same-origin",
        }
      );
      if (res.ok) {
        props.setHasChange(false);
        onSave(props.cid, props.chart!.editPasswd);
      } else {
        try {
          const resBody = (await res.json()) as {
            message?: string;
            cid?: string;
          };
          setErrorMsg(`${res.status}: ${resBody.message}`);
        } catch {
          setErrorMsg(`${res.status} Error`);
        }
      }
    }
    setSaving(false);
  };
  const downloadExtension = `fn${props.chart?.ver}.yml`;
  const download = () => {
    // editPasswdだけ消す
    const yml = YAML.stringify({ ...props.chart, editPasswd: "" });
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
      let newChart: Chart | null = null;
      try {
        const content = YAML.parse(new TextDecoder().decode(buffer));
        if (typeof content.ver === "number") {
          originalVer = content.ver;
        }
        newChart = await validateChart(content);
      } catch (e1) {
        console.warn("fallback to msgpack deserialize");
        try {
          const content = msgpack.deserialize(buffer);
          if (typeof content.ver === "number") {
            originalVer = content.ver;
          }
          newChart = await validateChart(content);
        } catch (e2) {
          console.error(e1);
          console.error(e2);
          setUploadMsg(t("loadFail"));
        }
      }
      if (newChart) {
        if (confirm(t("confirmLoad"))) {
          props.setChart({
            ...newChart,
            editPasswd: props.chart?.editPasswd || "",
          });
          props.setConvertedFrom(originalVer);
        }
      }
      target.value = "";
    }
  };

  return (
    <>
      <div className="mb-2">
        <span className="">{t("fileSize")}:</span>
        <span className="inline-block">
          <span className="ml-2">{Math.round(props.fileSize / 1000)} kB</span>
          <span className="ml-1 text-sm ">
            {t("fileSizeMax", { max: chartMaxSize / 1000 })}
          </span>
        </span>
        <ProgressBar value={props.fileSize / chartMaxSize} />
      </div>
      <div className="mb-1">
        <ExternalLink
          onClick={() => {
            if (props.sessionData) {
              initSession(props.sessionData, props.sessionId);
              window
                .open(`/${props.locale}/play?sid=${props.sessionId}`, "_blank")
                ?.focus();
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
        <Button text={t("saveToServer")} onClick={save} loading={saving} />
        <span className="inline-block ml-1 ">{errorMsg}</span>
        {props.hasChange && (
          <span className="inline-block ml-1 text-amber-600 ">
            {t("hasUnsaved")}
          </span>
        )}
        {props.convertedFrom < currentChartVer && (
          <span className="inline-block ml-1 text-amber-600 text-sm ">
            <Caution className="inline-block mr-1 translate-y-0.5 " />
            {t("convertingWarning", { ver: props.convertedFrom })}
          </span>
        )}
      </div>
      {props.cid && (
        <>
          <div className="ml-2">
            <span className="hidden edit-wide:inline-block mr-2">
              {t("shareLink")}:
            </span>
            <ExternalLink href={`/share/${props.cid}`}>
              <span className="edit-wide:hidden">{t("shareLink")}</span>
              <span className="hidden edit-wide:inline text-sm">
                {origin}/share/{props.cid}
              </span>
            </ExternalLink>
            {hasClipboard && (
              <Button
                className="ml-2"
                text={t("copy")}
                onClick={() =>
                  navigator.clipboard.writeText(`${origin}/share/${props.cid}`)
                }
              />
            )}
          </div>
        </>
      )}
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
          <label className={buttonStyle + " inline-block"} htmlFor="upload-bin">
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
