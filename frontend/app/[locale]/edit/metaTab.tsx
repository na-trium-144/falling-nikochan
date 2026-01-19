import Button, { ButtonStyledLabel } from "@/common/button.js";
import Input from "@/common/input.js";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId.js";
import { ChangeEvent, useState } from "react";
import {
  ChartEditing,
  lastHashChangeVer,
  lastIncompatibleVer,
} from "@falling-nikochan/chart";
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
import { useDisplayMode } from "@/scale.js";
import { downloadExtension, LocalLoadState, SaveState } from "./chartState";
import { APIError } from "@/common/apiError";

interface Props {
  chart?: ChartEditing;
  savePasswd: boolean;
  setSavePasswd: (b: boolean) => void;
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
          actualValue={props.chart?.meta.ytId || ""}
          updateValue={(v: string) => {
            if (props.chart) {
              const ytId = getYouTubeId(v);
              props.chart?.updateMeta({ ytId });
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
          actualValue={props.chart?.meta.title || ""}
          updateValue={(v: string) => props.chart?.updateMeta({ title: v })}
          left
        />
      </p>
      <p className="ml-2 ">
        <span className="inline-block w-max">{t("musicComposer")}</span>
        <Input
          className="text-sm font-title shrink w-80 max-w-full"
          actualValue={props.chart?.meta.composer || ""}
          updateValue={(v: string) => props.chart?.updateMeta({ composer: v })}
          left
        />
      </p>
      <p className="ml-2 mb-2">
        <span className="inline-block w-max">{t("chartCreator")}</span>
        <Input
          className="font-title shrink w-40 max-w-full"
          actualValue={props.chart?.meta.chartCreator || ""}
          updateValue={(v: string) =>
            props.chart?.updateMeta({ chartCreator: v })
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
            actualValue={props.chart?.changePasswd || ""}
            updateValue={(pw) => props.chart?.setChangePasswd(pw)}
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
  chart?: ChartEditing;
  locale: string;
  savePasswd: boolean;
  setSavePasswd: (b: boolean) => void;

  remoteSave: () => Promise<void>;
  saveState: SaveState;
  remoteDelete: () => Promise<void>;
  localSave: () => void;
  localSaveState: SaveState;
  localLoad: (buffer: ArrayBuffer) => Promise<void>;
  localLoadState: LocalLoadState;
}
export function MetaTab(props: Props2) {
  const t = useTranslations("edit.meta");
  const te = useTranslations("error");
  const router = useRouter();
  const shareLink = useShareLink(
    props.chart?.cid,
    props.chart?.toMin(),
    props.locale
  );
  const hasLevelData =
    props.chart?.levels &&
    props.chart.levels.length > 0 &&
    props.chart.levels.some(
      (l) => l.freeze.notes.length > 0 && !l.meta.unlisted
    );
  const { isTouch } = useDisplayMode();

  return (
    <>
      <div className="mb-2">
        <span className="">{t("eventNum")}:</span>
        <span className="inline-block">
          <span className="ml-1">{props.chart?.numEvents}</span>
          <span className="ml-1 text-sm ">/</span>
          <span className="ml-1 text-sm ">{chartMaxEvent}</span>
        </span>
        <HelpIcon>{t.rich("eventNumHelp", { br: () => <br /> })}</HelpIcon>
        <ProgressBar value={(props.chart?.numEvents || 0) / chartMaxEvent} />
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
          <span className="ml-1 mr-2 ">{props.chart?.cid || t("unsaved")}</span>
        </span>
        <HelpIcon>{t.rich("saveToServerHelp", { br: () => <br /> })}</HelpIcon>
        <Button
          text={t("saveToServer")}
          onClick={props.remoteSave}
          loading={props.saveState === "saving"}
          disabled={
            !props.chart?.meta.ytId ||
            (!props.chart?.cid && !props.chart?.changePasswd)
          }
        />
        <span className="inline-block ml-1 ">
          {props.saveState === "ok"
            ? t("saveDone")
            : props.saveState instanceof APIError
              ? props.saveState.format(te)
              : !props.chart?.meta.ytId
                ? t("saveFail.noId")
                : !props.chart?.cid && !props.chart?.changePasswd
                  ? t("saveFail.noPasswd")
                  : null}
        </span>
        {props.chart?.hasChange && (
          <span className="inline-block ml-1 text-amber-600 ">
            {t("hasUnsaved")}
          </span>
        )}
        {props.chart &&
        /*props.convertedFrom < currentChartVer*/
        props.chart.convertedFrom <= lastIncompatibleVer ? (
          <span className="inline-block ml-1 text-amber-600 text-sm ">
            <Caution className="inline-block mr-1 translate-y-0.5 " />
            {t("convertingIncompatible", { ver: props.chart.convertedFrom })}
          </span>
        ) : (
          props.chart &&
          props.chart.convertedFrom <= lastHashChangeVer && (
            <span className="inline-block ml-1 text-amber-600 text-sm ">
              <Caution className="inline-block mr-1 translate-y-0.5 " />
              {t("convertingHashChange", { ver: props.chart.convertedFrom })}
            </span>
          )
        )}
      </div>
      {props.chart?.cid && (
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
            <span className="inline-block ml-2">{shareLink.buttons}</span>
          </div>
        </>
      )}
      <p className="mb-2 ml-2 ">
        <CheckBox
          className="ml-0 "
          value={props.chart?.meta.published || false}
          onChange={(v: boolean) => props.chart?.updateMeta({ published: v })}
          disabled={!hasLevelData || !props.chart?.meta.ytId}
        >
          {t("publish")}
        </CheckBox>
        <HelpIcon>{t.rich("publishHelp", { br: () => <br /> })}</HelpIcon>
        <span className="inline-block ml-2 text-sm">
          {!props.chart?.meta.ytId
            ? t("publishFail.noId")
            : !hasLevelData
              ? t("publishFail.empty")
              : null}
        </span>
      </p>
      <p>
        <Button
          text={t("deleteFromServer")}
          onClick={props.remoteDelete}
          disabled={!props.chart?.cid}
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
            <ButtonStyledLabel htmlFor="upload-bin">
              {t("loadFromLocal")}
            </ButtonStyledLabel>
            <span className="inline-block ml-1">
              {props.localSaveState === "ok"
                ? t("saveDone")
                : props.localLoadState === "ok"
                  ? null
                  : props.localLoadState === "loadFail"
                    ? t("loadFail")
                    : null}
            </span>
            <input
              type="file"
              className="hidden"
              id="upload-bin"
              name="upload-bin"
              onChange={async (e: ChangeEvent) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length >= 1) {
                  const f = target.files[0];
                  const buffer = await f.arrayBuffer();
                  target.value = "";
                  await props.localLoad(buffer);
                }
              }}
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
