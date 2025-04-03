"use client";

import {
  Chart9Edit,
  defaultNoteCommand,
  findInsertLine,
  NoteCommand,
} from "@falling-nikochan/chart";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import FallingWindow from "./fallingWindow.js";
import {
  findBpmIndexFromStep,
  getSignatureState,
  getStep,
  getTimeSec,
  loadChart,
  Note,
} from "@falling-nikochan/chart";
import Button from "@/common/button.js";
import TimeBar from "./timeBar.js";
import Input from "@/common/input.js";
import TimingTab from "./timingTab.js";
import NoteTab from "./noteTab.js";
import { Box, modalBg } from "@/common/box.js";
import { MetaTab } from "./metaTab.js";
import msgpack from "@ygoe/msgpack";
import { addRecent } from "@/common/recent.js";
import {
  ChartEdit,
  convertToPlay,
  createBrief,
  currentChartVer,
  emptyChart,
  LevelEdit,
  LevelMin,
  levelTypes,
  numEvents,
  validateChart,
} from "@falling-nikochan/chart";
import { Step, stepAdd, stepCmp, stepZero } from "@falling-nikochan/chart";
import { MobileHeader } from "@/common/header.js";
import {
  getPasswd,
  preferSavePasswd,
  setPasswd,
  unsetPasswd,
} from "@/common/passwdCache.js";
import { LuaTabPlaceholder, LuaTabProvider, useLuaExecutor } from "./luaTab.js";
import {
  luaAddBpmChange,
  luaDeleteBpmChange,
  luaUpdateBpmChange,
} from "@falling-nikochan/chart";
import {
  luaAddSpeedChange,
  luaDeleteSpeedChange,
  luaUpdateSpeedChange,
} from "@falling-nikochan/chart";
import {
  luaAddNote,
  luaDeleteNote,
  luaUpdateNote,
} from "@falling-nikochan/chart";
import Select from "@/common/select.js";
import LevelTab from "./levelTab.js";
import { initSession, SessionData } from "@/play/session.js";
import {
  luaAddBeatChange,
  luaDeleteBeatChange,
  luaUpdateBeatChange,
} from "@falling-nikochan/chart";
import { useDisplayMode } from "@/scale.js";
import { Forbid, Move } from "@icon-park/react";
import { linkStyle1 } from "@/common/linkStyle.js";
import { GuideMain } from "./guideMain.js";
import { levelBgColors } from "@/common/levelColors.js";
import { Signature } from "@falling-nikochan/chart";
import { Chart5 } from "@falling-nikochan/chart";
import { Chart6 } from "@falling-nikochan/chart";
import { Chart7 } from "@falling-nikochan/chart";
import CheckBox from "@/common/checkBox";
import { useTranslations } from "next-intl";
import { CaptionProvider, HelpIcon } from "@/common/caption.js";
import { titleWithSiteName } from "@/common/title.js";
import { Chart8Edit } from "@falling-nikochan/chart";
import { SlimeSVG } from "@/common/slime.js";

export default function EditAuth(props: {
  locale: string;
  guideContents: ReactNode[];
}) {
  const { locale } = props;
  const t = useTranslations("edit");
  const te = useTranslations("error");

  // cid が "new" の場合空のchartで編集をはじめて、post時にcidが振られる
  const cidInitial = useRef<string>("");
  const [cid, setCid] = useState<string | undefined>("");

  // chartのgetやpostに必要なパスワード
  // post時には前のchartのパスワードを入力し、その後は新しいパスワードを使う
  const [editPasswd, setEditPasswd] = useState<string>("");
  // fetchに成功したらセット、
  // 以降保存のたびにこれを使ってpostし、新しいパスワードでこれを上書き
  const currentPasswd = useRef<string | null>(null);
  const [savePasswd, setSavePasswd] = useState<boolean>(false);
  const [passwdFailed, setPasswdFailed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [guidePage, setGuidePage] = useState<number | null>(null);

  const [chart, setChart] = useState<ChartEdit>();
  const [errorStatus, setErrorStatus] = useState<number>();
  const [errorMsg, setErrorMsg] = useState<string>();
  const [convertedFrom, setConvertedFrom] = useState<number>(currentChartVer);

  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(0);
  const [hasChange, setHasChange] = useState<boolean>(false);

  // PWAでテストプレイを押した場合に編集中の譜面データをsessionStorageに退避
  const saveEditSession = useCallback(() => {
    sessionStorage.setItem(
      "editSession",
      JSON.stringify({
        cid,
        editPasswd,
        currentPasswd,
        savePasswd,
        chart,
        convertedFrom,
        currentLevelIndex,
        hasChange,
      }),
    );
  }, [
    cid,
    editPasswd,
    currentPasswd,
    savePasswd,
    chart,
    convertedFrom,
    currentLevelIndex,
    hasChange,
  ]);
  const fetchChart = useCallback(
    async (
      isFirst: boolean,
      bypass: boolean,
      editPasswd: string,
      savePasswd: boolean,
    ) => {
      if (sessionStorage.getItem("editSession")) {
        const data = JSON.parse(sessionStorage.getItem("editSession")!);
        sessionStorage.removeItem("editSession");
        if (
          data.cid === cidInitial.current ||
          (data.cid === undefined && cidInitial.current === "new")
        ) {
          setCid(data.cid);
          setEditPasswd(data.editPasswd);
          currentPasswd.current = data.currentPasswd.current;
          setSavePasswd(data.savePasswd);
          setChart(data.chart);
          setConvertedFrom(data.convertedFrom);
          setCurrentLevelIndex(data.currentLevelIndex);
          setHasChange(data.hasChange);
          setPasswdFailed(false);
          setLoading(false);
          setErrorStatus(undefined);
          setErrorMsg(undefined);
          return;
        }
      }
      if (cidInitial.current === "new") {
        setGuidePage(1);
        setCid(undefined);
        setPasswdFailed(false);
        setLoading(false);
        setChart(emptyChart(locale));
      } else {
        setCid(cidInitial.current);
        setPasswdFailed(false);
        setLoading(true);
        const q = new URLSearchParams();
        if (getPasswd(cidInitial.current)) {
          q.set("ph", getPasswd(cidInitial.current)!);
        }
        if (editPasswd) {
          currentPasswd.current = editPasswd;
          q.set("p", currentPasswd.current);
        } else {
          currentPasswd.current = null;
        }
        if (bypass) {
          q.set("pbypass", "1");
        }
        let res: Response | null = null;
        try {
          res = await fetch(
            process.env.BACKEND_PREFIX +
              `/api/chartFile/${cidInitial.current}?` +
              q.toString(),
            {
              cache: "no-store",
              credentials:
                process.env.NODE_ENV === "development"
                  ? "include"
                  : "same-origin",
            },
          );
          if (res?.ok) {
            try {
              const chartRes:
                | Chart5
                | Chart6
                | Chart7
                | Chart8Edit
                | Chart9Edit = msgpack.deserialize(await res.arrayBuffer());
              setConvertedFrom(chartRes.ver);
              const chart: ChartEdit = await validateChart(chartRes);
              if (savePasswd) {
                if (currentPasswd.current) {
                  try {
                    const res = await fetch(
                      process.env.BACKEND_PREFIX +
                        `/api/hashPasswd/${cidInitial.current}?p=${currentPasswd.current}`,
                      {
                        credentials:
                          process.env.NODE_ENV === "development"
                            ? "include"
                            : "same-origin",
                      },
                    );
                    setPasswd(cidInitial.current, await res.text());
                  } catch {
                    //ignore
                  }
                }
              } else {
                unsetPasswd(cidInitial.current);
              }
              setChart(chart);
              setErrorStatus(undefined);
              setErrorMsg(undefined);
              addRecent("edit", cidInitial.current);
            } catch (e) {
              console.error(e);
              setChart(undefined);
              setErrorStatus(undefined);
              setErrorMsg(te("badResponse"));
            }
          } else {
            if (res?.status === 401) {
              if (!isFirst) {
                setPasswdFailed(true);
              }
              setChart(undefined);
            } else {
              setChart(undefined);
              setErrorStatus(res?.status);
              try {
                const message = ((await res?.json()) as { message?: string })
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
          }
        } catch (e) {
          console.error(e);
          setChart(undefined);
          setErrorStatus(undefined);
          setErrorMsg(te("fetchError"));
        }
        setLoading(false);
      }
    },
    [locale, te],
  );
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("cid")) {
      cidInitial.current = params.get("cid")!;
    }
    setSavePasswd(preferSavePasswd());
    document.title = titleWithSiteName(
      t("title", { title: "", cid: cidInitial.current }),
    );
    // 保存済みの古いハッシュを更新する必要があるので、savePasswd=true
    // レンダリングの都合上 cidInitial.current を先に反映させたいため、setTimeoutで1段階遅延
    const ft = setTimeout(() => void fetchChart(true, false, "", true));
    return () => clearTimeout(ft);
  }, [fetchChart, t]);

  return (
    <Page
      saveEditSession={saveEditSession}
      guideContents={props.guideContents}
      chart={chart}
      setChart={setChart}
      cid={cid}
      setCid={setCid}
      guidePage={guidePage}
      setGuidePage={setGuidePage}
      convertedFrom={convertedFrom}
      setConvertedFrom={setConvertedFrom}
      locale={locale}
      currentPasswd={currentPasswd}
      savePasswdInitial={savePasswd}
      currentLevelIndex={currentLevelIndex}
      setCurrentLevelIndex={setCurrentLevelIndex}
      hasChange={hasChange}
      setHasChange={setHasChange}
      modal={
        chart === undefined ? (
          loading ? (
            <p>
              <SlimeSVG />
              Loading...
            </p>
          ) : errorStatus !== undefined || errorMsg !== undefined ? (
            <p>
              {errorStatus ? `${errorStatus}: ` : ""}
              {errorMsg}
            </p>
          ) : (
            <div className="text-center ">
              <p className="mb-2 ">
                <span className="">{t("chartId")}:</span>
                <span className="ml-2 ">{cid}</span>
              </p>
              <p>{t("enterPasswd")}</p>
              {passwdFailed && <p>{t("passwdFailed")}</p>}
              <Input
                actualValue={editPasswd}
                updateValue={setEditPasswd}
                left
                passwd
              />
              <Button
                text={t("submitPasswd")}
                onClick={() => fetchChart(false, false, editPasswd, savePasswd)}
              />
              <p>
                <CheckBox value={savePasswd} onChange={setSavePasswd}>
                  {t("savePasswd")}
                </CheckBox>
              </p>
              {process.env.NODE_ENV === "development" && (
                <p className="mt-2 ">
                  <button
                    className={linkStyle1 + "w-max m-auto "}
                    onClick={() => {
                      void (async () => {
                        await fetchChart(false, true, editPasswd, savePasswd);
                      })();
                    }}
                  >
                    {t("bypassPasswd")}
                  </button>
                </p>
              )}
            </div>
          )
        ) : null
      }
    />
  );
}

interface Props {
  saveEditSession: () => void;
  guideContents: ReactNode[];
  chart?: ChartEdit;
  setChart: (chart: ChartEdit) => void;
  cid: string | undefined;
  setCid: (cid: string | undefined) => void;
  guidePage: number | null;
  setGuidePage: (v: number | null) => void;
  convertedFrom: number;
  setConvertedFrom: (v: number) => void;
  locale: string;
  currentPasswd: { current: string | null };
  savePasswdInitial: boolean;
  currentLevelIndex: number;
  setCurrentLevelIndex: (v: number) => void;
  hasChange: boolean;
  setHasChange: (v: boolean) => void;
  modal?: ReactNode;
}
function Page(props: Props) {
  const {
    chart,
    setChart,
    cid,
    setCid,
    convertedFrom,
    setConvertedFrom,
    locale,
    currentLevelIndex,
    setCurrentLevelIndex,
    hasChange,
    setHasChange,
    guidePage,
    setGuidePage,
  } = props;
  const t = useTranslations("edit");
  const { isTouch } = useDisplayMode();

  const currentLevel = chart?.levels.at(currentLevelIndex);

  const luaExecutor = useLuaExecutor();

  const [sessionId, setSessionId] = useState<number>();
  const [sessionData, setSessionData] = useState<SessionData>();
  const chartNumEvent = chart ? numEvents(chart) : 0;
  // 変更する場合は空文字列以外をセットすると、サーバーへ送信時にchart.changePasswdにセットされる
  const [newPasswd, setNewPasswd] = useState<string>("");
  const [savePasswd, setSavePasswd] = useState<boolean | null>(null);
  useEffect(() => {
    if (chart && savePasswd === null) {
      setSavePasswd(props.savePasswdInitial);
    }
  }, [chart, savePasswd, props.savePasswdInitial]);

  // 譜面の更新 (メタデータの変更など)
  const changeChart = (chart: ChartEdit) => {
    setHasChange(true);
    setChart(chart);
  };
  useEffect(() => {
    document.title = titleWithSiteName(
      t("title", { title: chart?.title || "", cid: cid || "" }),
    );
  });
  useEffect(() => {
    void (async () => {
      if (chart) {
        if (sessionId === undefined) {
          setSessionId(initSession(null));
        }
        const data = {
          cid: cid,
          lvIndex: currentLevelIndex,
          brief: await createBrief(chart, new Date().getTime()),
          level: convertToPlay(chart, currentLevelIndex),
          editing: true,
        };
        setSessionData(data);
        initSession(data, sessionId);
        // 譜面の編集時に毎回sessionに書き込む (テストプレイタブのリロードだけで読めるように)
        // 念の為metaTabでテストプレイボタンが押された時にも書き込んでいる
      }
    })();
  }, [sessionId, chart, currentLevelIndex, cid]);

  // レベルの更新
  // levelMin(メタデータ更新時) または lua のみを引数にとり、実行し、chartに反映
  const changeLevel = async (
    newLevel: LevelMin | string[] | null | undefined,
  ) => {
    if (chart && newLevel && currentLevelIndex < chart.levels.length) {
      const newChart: ChartEdit = {
        ...chart,
        levels: chart.levels.map((l) => ({ ...l })),
      };
      if (Array.isArray(newLevel)) {
        newChart.levels[currentLevelIndex].lua = newLevel;
      } else {
        newChart.levels[currentLevelIndex] = {
          ...newChart.levels[currentLevelIndex],
          ...newLevel,
        };
      }
      const levelFreezed = await luaExecutor.exec(
        newChart.levels[currentLevelIndex].lua.join("\n"),
      );
      if (levelFreezed) {
        newChart.levels[currentLevelIndex] = {
          ...newChart.levels[currentLevelIndex],
          ...levelFreezed,
        };
        changeChart(newChart);
      }
    }
  };

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (hasChange) {
        const confirmationMessage = t("confirmUnsaved");

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [hasChange, sessionId, t]);

  const ref = useRef<HTMLDivElement>(null!);

  // 現在時刻 offsetを引く前
  // setはytPlayerから取得。変更するにはchangeCurrentTimeSecを呼ぶ
  const [currentTimeSecWithoutOffset, setCurrentTimeSecWithoutOffset] =
    useState<number>(0);
  // 現在時刻に対応するstep
  const [currentStep, setCurrentStep] = useState<Step>(stepZero());
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  // snapの刻み幅 を1stepの4n分の1にする
  const [snapDivider, setSnapDivider] = useState<number>(4);
  const [timeBarPxPerSec, setTimeBarPxPerSec] = useState<number>(300);

  const ss =
    currentLevel && getSignatureState(currentLevel.signature, currentStep);
  const currentStepStr = ss
    ? ss.barNum +
      1 +
      ";" +
      (ss.count.fourth + 1) +
      (ss.count.numerator > 0
        ? "+" + ss.count.numerator + "/" + ss.count.denominator * 4
        : "")
    : null;

  // offsetを引いた後の時刻
  const currentTimeSec = currentTimeSecWithoutOffset - (chart?.offset || 0);
  // 現在選択中の音符 (currentStepSnappedに一致)
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const hasCurrentNote =
    currentNoteIndex >= 0 &&
    currentLevel?.notes.at(currentNoteIndex) !== undefined;
  const [notesCountInStep, setNotesCountInStep] = useState<number>(0);
  const [notesIndexInStep, setNotesIndexInStep] = useState<number>(0);
  const canAddNote = !(
    (currentLevel?.type === "Single" && notesCountInStep >= 1) ||
    (currentLevel?.type === "Double" && notesCountInStep >= 2)
  );
  useEffect(() => {
    if (currentLevel) {
      let notesCountInStep = 0;
      let notesIndexInStep = 0;
      for (let i = 0; i < currentLevel.notes.length; i++) {
        const n = currentLevel.notes[i];
        if (stepCmp(currentStep, n.step) > 0) {
          continue;
        } else if (stepCmp(currentStep, n.step) == 0) {
          if (i < currentNoteIndex) {
            notesIndexInStep++;
          }
          notesCountInStep++;
        } else {
          break;
        }
      }
      setNotesCountInStep(notesCountInStep);
      setNotesIndexInStep(notesIndexInStep);
    }
  }, [currentLevel, currentStep, currentNoteIndex]);

  // currentTimeが変わったときcurrentStepを更新
  const prevTimeSec = useRef<number>(-1);
  useEffect(() => {
    if (currentLevel && currentTimeSec !== prevTimeSec.current) {
      const step = getStep(
        currentLevel.bpmChanges,
        currentTimeSec,
        snapDivider,
      );
      if (stepCmp(step, currentStep) !== 0) {
        setCurrentStep(step);
      }
      let noteIndex: number | undefined = undefined;
      if (
        !hasCurrentNote ||
        stepCmp(currentLevel.notes[currentNoteIndex].step, step) != 0
      ) {
        if (currentTimeSec < prevTimeSec.current) {
          noteIndex = currentLevel.notes.findLastIndex(
            (n) => stepCmp(n.step, step) == 0,
          );
        } else {
          noteIndex = currentLevel.notes.findIndex(
            (n) => stepCmp(n.step, step) == 0,
          );
        }
        if (currentNoteIndex !== noteIndex) {
          setCurrentNoteIndex(noteIndex);
        }
      }
      let line: number | null;
      if (noteIndex !== undefined && noteIndex >= 0) {
        line = currentLevel.notes[noteIndex].luaLine;
      } else {
        line = findInsertLine(currentLevel, step, false).luaLine;
      }
      if (currentLine !== line) {
        setCurrentLine(line);
      }
    }
    prevTimeSec.current = currentTimeSec;
  }, [
    currentLevel,
    snapDivider,
    currentTimeSec,
    currentStep,
    currentNoteIndex,
    currentLine,
    hasCurrentNote,
  ]);

  // それぞれの小節線位置のコード内での行番号
  const [barLines, setBarLines] = useState<
    { barNum: number; luaLine: number }[]
  >([]);
  useEffect(() => {
    const barLines: { barNum: number; luaLine: number }[] = [];
    if (currentLevel) {
      let step = stepZero();
      const lastRest = currentLevel.rest.at(
        currentLevel.rest.length - 1,
      )?.begin;
      while (lastRest !== undefined && stepCmp(step, lastRest) <= 0) {
        const ss = getSignatureState(currentLevel.signature, step);
        if (stepCmp(ss.offset, stepZero()) === 0) {
          const line = findInsertLine(currentLevel, step, false).luaLine;
          if (line !== null) {
            barLines.push({ barNum: ss.barNum + 1, luaLine: line });
          }
        }
        step = stepAdd(step, { fourth: 0, numerator: 1, denominator: 4 });
      }
    }
    setBarLines(barLines);
  }, [currentLevel]);

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const changePlaybackRate = (rate: number) => {
    ytPlayer.current?.setPlaybackRate(rate);
  };

  // ytPlayerが再生中
  const [playing, setPlaying] = useState<boolean>(false);
  // ytPlayerが準備完了
  const [ready, setReady] = useState<boolean>(false);
  const onReady = useCallback(() => {
    console.log("ready");
    setReady(true);
  }, []);
  const onStart = useCallback(() => {
    console.log("start");
    setPlaying(true);
  }, []);
  const onStop = useCallback(() => {
    console.log("stop");
    setPlaying(false);
  }, []);
  const start = () => {
    ytPlayer.current?.playVideo();
    ref.current.focus();
  };
  const stop = () => {
    ytPlayer.current?.pauseVideo();
    ref.current.focus();
  };
  const changeCurrentTimeSec = (timeSec: number, focus = true) => {
    if (ytPlayer.current?.seekTo) {
      ytPlayer.current?.seekTo(timeSec, true);
    }
    if (focus) {
      ref.current.focus();
    }
  };
  const seekRight1 = () => {
    if (currentLevel) {
      if (
        hasCurrentNote &&
        currentLevel.notes[currentNoteIndex + 1] &&
        stepCmp(currentStep, currentLevel.notes[currentNoteIndex + 1].step) ===
          0
      ) {
        setCurrentNoteIndex(currentNoteIndex + 1);
      } else {
        seekStepRel(1);
      }
    }
    ref.current.focus();
  };
  const seekLeft1 = () => {
    if (chart) {
      if (
        hasCurrentNote &&
        currentLevel.notes[currentNoteIndex - 1] &&
        stepCmp(currentStep, currentLevel.notes[currentNoteIndex - 1].step) ===
          0
      ) {
        setCurrentNoteIndex(currentNoteIndex - 1);
      } else {
        seekStepRel(-1);
      }
    }
    ref.current.focus();
  };
  const seekStepRel = (move: number) => {
    let newStep = stepAdd(currentStep, {
      fourth: 0,
      numerator: move,
      denominator: snapDivider,
    });
    seekStepAbs(newStep, true);
  };
  const seekStepAbs = useCallback(
    (newStep: Step, focus = false) => {
      // デフォルト引数はluaTabからの呼び出しで使う
      if (chart && currentLevel) {
        if (stepCmp(newStep, stepZero()) < 0) {
          newStep = stepZero();
        }
        changeCurrentTimeSec(
          getTimeSec(currentLevel.bpmChanges, newStep) + chart.offset,
          focus,
        );
      }
      if (focus) {
        ref.current.focus();
      }
    },
    [chart, currentLevel],
  );
  const seekSec = (moveSec: number, focus = true) => {
    if (chart) {
      changeCurrentTimeSec(currentTimeSec + chart.offset + moveSec, focus);
    }
  };

  useEffect(() => {
    const i = setInterval(() => {
      if (ytPlayer.current?.getCurrentTime) {
        setCurrentTimeSecWithoutOffset(ytPlayer.current.getCurrentTime());
      }
    }, 50);
    return () => clearInterval(i);
  }, []);

  const [notesAll, setNotesAll] = useState<Note[]>([]);
  useEffect(() => {
    if (chart) {
      setNotesAll(loadChart(convertToPlay(chart, currentLevelIndex)).notes);
    }
  }, [chart, currentLevelIndex]);

  const [tab, setTab] = useState<number>(0);
  const tabNameKeys = ["meta", "timing", "level", "note", "code"];
  const isCodeTab = tab === 4;
  const openGuide = () => setGuidePage([2, 4, 5, 6, 7][tab]);

  const [dragMode, setDragMode] = useState<null | "p" | "v" | "a">(null);
  useEffect(() => {
    if (dragMode === null && !isTouch && chart) {
      setDragMode("p");
    }
  }, [dragMode, isTouch, chart]);

  const changeOffset = (ofs: number) => {
    if (chart /*&& offsetValid(ofs)*/) {
      changeChart({ ...chart, offset: ofs });
    }
  };
  const currentBpmIndex =
    currentLevel && findBpmIndexFromStep(currentLevel.bpmChanges, currentStep);
  const currentBpm =
    currentLevel &&
    currentLevel.bpmChanges.length > 0 &&
    currentBpmIndex !== undefined
      ? currentLevel.bpmChanges[currentBpmIndex].bpm
      : 120;
  const currentSpeedIndex =
    currentLevel &&
    findBpmIndexFromStep(currentLevel.speedChanges, currentStep);
  const currentSpeed =
    currentLevel &&
    currentLevel.speedChanges.length > 0 &&
    currentSpeedIndex !== undefined
      ? currentLevel.speedChanges[currentSpeedIndex].bpm
      : 120;
  const changeBpm = (bpm: number | null, speed: number | null) => {
    if (currentLevel) {
      let newLevel: LevelEdit | null = null;
      if (currentBpmIndex !== undefined && bpm !== null) {
        newLevel = luaUpdateBpmChange(currentLevel, currentBpmIndex, bpm);
      }
      if (currentSpeedIndex !== undefined && speed !== null) {
        newLevel = luaUpdateSpeedChange(
          newLevel || currentLevel,
          currentSpeedIndex,
          speed,
        );
      }
      changeLevel(newLevel?.lua);
    }
  };
  const speedChangeHere =
    currentLevel &&
    currentSpeedIndex !== undefined &&
    currentLevel.speedChanges.length > 0 &&
    stepCmp(currentLevel.speedChanges[currentSpeedIndex].step, currentStep) ===
      0;
  const bpmChangeHere =
    currentLevel &&
    currentBpmIndex !== undefined &&
    currentLevel.bpmChanges.length > 0 &&
    stepCmp(currentLevel.bpmChanges[currentBpmIndex].step, currentStep) === 0;
  const toggleBpmChangeHere = (bpm: boolean | null, speed: boolean | null) => {
    if (chart && currentLevel && stepCmp(currentStep, stepZero()) > 0) {
      let newLevel: LevelEdit | null = null;
      if (currentBpmIndex !== undefined && bpm !== null) {
        if (bpm && !bpmChangeHere) {
          newLevel = luaAddBpmChange(currentLevel, {
            step: currentStep,
            bpm: currentBpm,
            timeSec: currentTimeSec,
          });
        } else if (!bpm && bpmChangeHere) {
          newLevel = luaDeleteBpmChange(currentLevel, currentBpmIndex);
        }
      }
      if (currentSpeedIndex !== undefined && speed !== null) {
        if (speed && !speedChangeHere) {
          newLevel = luaAddSpeedChange(newLevel || currentLevel, {
            step: currentStep,
            bpm: currentSpeed,
            timeSec: currentTimeSec,
          });
        } else if (!speed && speedChangeHere) {
          newLevel = luaDeleteSpeedChange(
            newLevel || currentLevel,
            currentSpeedIndex,
          );
        }
      }
      changeLevel(newLevel?.lua);
    }
  };

  const currentSignatureIndex =
    currentLevel && findBpmIndexFromStep(currentLevel.signature, currentStep);
  const currentSignature = currentLevel?.signature.at(
    currentSignatureIndex || 0,
  );
  const prevSignature =
    currentSignatureIndex && currentSignatureIndex > 0
      ? currentLevel?.signature.at(currentSignatureIndex - 1)
      : undefined;
  const signatureChangeHere =
    currentSignature && stepCmp(currentSignature.step, currentStep) === 0;
  const changeSignature = (s: Signature) => {
    if (chart && currentLevel && currentSignatureIndex !== undefined) {
      const newLevel = luaUpdateBeatChange(
        currentLevel,
        currentSignatureIndex,
        s,
      );
      changeLevel(newLevel?.lua);
    }
  };
  const toggleSignatureChangeHere = () => {
    if (
      chart &&
      currentLevel &&
      currentSignatureIndex !== undefined &&
      currentSignature &&
      stepCmp(currentStep, stepZero()) > 0
    ) {
      if (signatureChangeHere) {
        const newLevel = luaDeleteBeatChange(
          currentLevel,
          currentSignatureIndex,
        );
        changeLevel(newLevel?.lua);
      } else {
        const newLevel = luaAddBeatChange(currentLevel, {
          step: currentStep,
          offset: getSignatureState(currentLevel.signature, currentStep).offset,
          bars: currentSignature.bars,
          barNum: 0,
        });
        changeLevel(newLevel?.lua);
      }
    }
  };
  const addNote = (n: NoteCommand | null = copyBuf[0]) => {
    if (chart && currentLevel && n && canAddNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaAddNote(levelCopied, n, currentStep);
      if (newLevel !== null) {
        // 追加したnoteは同じ時刻の音符の中でも最後
        setCurrentNoteIndex(
          currentLevel.notes.findLastIndex(
            (n) => stepCmp(n.step, currentStep) == 0,
          ),
        );
        changeLevel(newLevel?.lua);
      }
    }
    ref.current.focus();
  };
  const deleteNote = () => {
    if (chart && currentLevel && hasCurrentNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaDeleteNote(levelCopied, currentNoteIndex);
      changeLevel(newLevel?.lua);
    }
    ref.current.focus();
  };
  const updateNote = (n: NoteCommand) => {
    if (chart && currentLevel && hasCurrentNote) {
      const levelCopied = { ...currentLevel };
      const newLevel = luaUpdateNote(levelCopied, currentNoteIndex, n);
      changeLevel(newLevel?.lua);
    }
    // ref.current.focus();
  };
  const [copyBuf, setCopyBuf] = useState<(NoteCommand | null)[]>(
    ([defaultNoteCommand()] as (NoteCommand | null)[]).concat(
      Array.from(new Array(9)).map(() => null),
    ),
  );
  const copyNote = (copyIndex: number) => {
    if (chart && currentLevel && hasCurrentNote) {
      const newCopyBuf = copyBuf.slice();
      newCopyBuf[copyIndex] = currentLevel.notes[currentNoteIndex];
      setCopyBuf(newCopyBuf);
    }
    ref.current.focus();
  };
  const pasteNote = (copyIndex: number, forceAdd: boolean = false) => {
    if (copyBuf[copyIndex]) {
      if (chart) {
        if (hasCurrentNote && !forceAdd) {
          updateNote(copyBuf[copyIndex]);
        } else {
          addNote(copyBuf[copyIndex]);
        }
      }
    }
    ref.current.focus();
  };

  return (
    <main
      className={
        "w-full h-dvh overflow-x-clip overflow-y-auto " +
        "edit-wide:overflow-y-clip " +
        (dragMode !== null ? "touch-none " : "")
      }
      tabIndex={0}
      ref={ref}
      onKeyDown={(e) => {
        if (chart && ready && !isCodeTab) {
          if (e.key === " " && !playing) {
            start();
          } else if (
            (e.key === "Escape" || e.key === "Esc" || e.key === " ") &&
            playing
          ) {
            stop();
          } else if (e.key === "Left" || e.key === "ArrowLeft") {
            seekLeft1();
          } else if (e.key === "Right" || e.key === "ArrowRight") {
            seekRight1();
          } else if (e.key === "PageUp") {
            seekStepRel(-snapDivider * 4);
          } else if (e.key === "PageDown") {
            seekStepRel(snapDivider * 4);
          } else if (e.key === ",") {
            seekSec(-1 / 30);
          } else if (e.key === ".") {
            seekSec(1 / 30);
          } else if (e.key === "c") {
            copyNote(0);
          } else if (e.key === "v") {
            pasteNote(0);
          } else if (
            Number(e.key) >= 1 &&
            Number(e.key) <= copyBuf.length - 1
          ) {
            pasteNote(Number(e.key));
          } else if (e.key === "n") {
            pasteNote(0, true);
          } else if (e.key === "b") {
            if (
              currentNoteIndex >= 0 &&
              currentLevel?.notes[currentNoteIndex]
            ) {
              const n = currentLevel.notes[currentNoteIndex];
              updateNote({ ...n, big: !n.big });
            }
          } else if (e.key === "Shift") {
            setDragMode("v");
          } else {
            //
          }
        }
      }}
      onKeyUp={(e) => {
        if (
          chart &&
          ready &&
          !isCodeTab &&
          (e.key === "Shift" || e.key === "Control")
        ) {
          setDragMode("p");
        }
      }}
    >
      <div
        className={
          "fixed z-10 top-0 inset-x-0 backdrop-blur-2xs " +
          "flex edit-wide:hidden flex-row items-center " +
          "bg-gradient-to-t to-70% from-sky-200/0 to-sky-200 " +
          "dark:from-orange-975/0 to-orange-975 "
        }
      >
        <MobileHeader className="flex-1 ">
          {t("titleShort")} ID: {cid}
        </MobileHeader>
        <Button text={t("help")} onClick={openGuide} />
      </div>
      <div className="w-0 h-13 edit-wide:hidden" />
      {chart === undefined ? (
        <div className={modalBg} onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-6">
            <Box
              className={
                "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
                "p-6 overflow-x-clip overflow-y-auto " +
                "shadow-lg "
              }
            >
              {props.modal}
            </Box>
          </div>
        </div>
      ) : guidePage !== null ? (
        <GuideMain
          content={props.guideContents[guidePage]}
          index={guidePage}
          setIndex={setGuidePage}
          close={() => setGuidePage(null)}
          locale={locale}
        />
      ) : null}

      <CaptionProvider>
        <LuaTabProvider>
          <div
            className={
              "w-full " +
              "edit-wide:h-full edit-wide:flex edit-wide:items-stretch edit-wide:flex-row "
            }
          >
            <div
              className={
                "edit-wide:basis-4/12 edit-wide:h-full edit-wide:p-3 " +
                "grow-0 shrink-0 flex flex-col items-stretch "
              }
            >
              <div className="hidden edit-wide:flex flex-row items-baseline mb-3 ">
                <span className="flex-1 ">
                  {t("titleShort")} ID: {cid}
                </span>
                <Button text={t("help")} onClick={openGuide} />
              </div>
              <div
                className={
                  "grow-0 shrink-0 p-3 rounded-lg flex flex-col items-center " +
                  (levelBgColors[
                    levelTypes.indexOf(currentLevel?.type || "")
                  ] || levelBgColors[1]) +
                  (chart ? "" : "invisible ")
                }
              >
                <FlexYouTube
                  fixedSide="width"
                  className={
                    "w-full h-max " + "edit-wide:w-full edit-wide:h-auto "
                  }
                  control={true}
                  id={chart?.ytId}
                  ytPlayer={ytPlayer}
                  onReady={onReady}
                  onStart={onStart}
                  onStop={onStop}
                  onPlaybackRateChange={setPlaybackRate}
                />
              </div>
              <div
                className={
                  "relative " +
                  "w-full aspect-square " +
                  "edit-wide:flex-1 edit-wide:basis-8/12 edit-wide:aspect-auto "
                }
              >
                <FallingWindow
                  inCodeTab={isCodeTab}
                  className="absolute inset-0"
                  notes={notesAll}
                  currentTimeSec={currentTimeSec || 0}
                  currentNoteIndex={currentNoteIndex}
                  currentLevel={currentLevel}
                  updateNote={updateNote}
                  dragMode={dragMode}
                  setDragMode={setDragMode}
                />
              </div>
              {chart && isTouch && (
                <button
                  className={
                    "self-start flex flex-row items-center " + linkStyle1
                  }
                  onClick={() => {
                    setDragMode(
                      dragMode === "p" ? "v" : dragMode === "v" ? null : "p",
                    );
                  }}
                >
                  <span className="relative inline-block w-8 h-8 ">
                    {dragMode === null ? (
                      <>
                        <Move className="absolute text-xl inset-0 w-max h-max m-auto " />
                        <Forbid className="absolute text-3xl inset-0 w-max h-max m-auto " />
                      </>
                    ) : (
                      <>
                        <Move
                          className="absolute text-xl inset-0 w-max h-max m-auto "
                          theme="two-tone"
                          fill={["#333", "#fc5"]}
                        />
                      </>
                    )}
                  </span>
                  <span className="">
                    {t("touchMode", { mode: dragMode || "null" })}
                  </span>
                </button>
              )}
            </div>
            <div
              className={
                "p-3 flex flex-col items-stretch " +
                "h-5/6 " +
                "edit-wide:h-full edit-wide:flex-1 "
              }
            >
              <div>
                <span className="mr-1">{t("playerControl")}:</span>
                <Select
                  options={["✕0.25", "✕0.5", "✕0.75", "✕1", "✕1.5", "✕2"]}
                  values={["0.25", "0.5", "0.75", "1", "1.5", "2"]}
                  value={playbackRate.toString()}
                  onChange={(s: string) => changePlaybackRate(Number(s))}
                />
                <Button
                  onClick={() => {
                    if (ready) {
                      if (!playing) {
                        start();
                      } else {
                        stop();
                      }
                    }
                  }}
                  text={
                    playing
                      ? t("playerControls.pause")
                      : t("playerControls.play")
                  }
                  keyName="Space"
                />
                <span className="inline-block">
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekStepRel(-snapDivider * 4);
                      }
                    }}
                    text={t("playerControls.moveStep", {
                      step: -snapDivider * 4,
                    })}
                    keyName="PageUp"
                  />
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekStepRel(snapDivider * 4);
                      }
                    }}
                    text={t("playerControls.moveStep", {
                      step: snapDivider * 4,
                    })}
                    keyName="PageDn"
                  />
                </span>
                <span className="inline-block">
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekLeft1();
                      }
                    }}
                    text={t("playerControls.moveStep", { step: -1 })}
                    keyName="←"
                  />
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekRight1();
                      }
                    }}
                    text={t("playerControls.moveStep", { step: 1 })}
                    keyName="→"
                  />
                </span>
                <span className="inline-block">
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekSec(-1 / 30);
                      }
                    }}
                    text={t("playerControls.moveMinus1F")}
                    keyName=","
                  />
                  <Button
                    onClick={() => {
                      if (ready) {
                        seekSec(1 / 30);
                      }
                    }}
                    text={t("playerControls.movePlus1F")}
                    keyName="."
                  />
                </span>
              </div>
              <div className="flex-none">
                <TimeBar
                  currentTimeSecWithoutOffset={currentTimeSecWithoutOffset}
                  currentNoteIndex={currentNoteIndex}
                  currentStep={currentStep}
                  chart={chart}
                  currentLevel={currentLevel}
                  notesAll={notesAll}
                  snapDivider={snapDivider}
                  timeBarPxPerSec={timeBarPxPerSec}
                />
              </div>
              <div className="flex flex-row items-baseline">
                <span>{t("stepUnit")} =</span>
                <span className="ml-2">1</span>
                <span className="ml-1">/</span>
                <Input
                  className="w-12"
                  actualValue={String(snapDivider * 4)}
                  updateValue={(v: string) => {
                    setSnapDivider(Number(v) / 4);
                  }}
                  isValid={(v) =>
                    !isNaN(Number(v)) &&
                    String(Math.floor(Number(v) / 4) * 4) === v
                  }
                />
                <HelpIcon className="self-center">
                  {t.rich("stepUnitHelp", { br: () => <br /> })}
                </HelpIcon>
                <div className="flex-1" />
                <span className="mr-1">{t("zoom")}</span>
                <Button
                  text="-"
                  onClick={() => setTimeBarPxPerSec(timeBarPxPerSec / 1.5)}
                />
                <Button
                  text="+"
                  onClick={() => setTimeBarPxPerSec(timeBarPxPerSec * 1.5)}
                />
              </div>
              <div className="flex flex-row ml-3 mt-3">
                {tabNameKeys.map((key, i) =>
                  i === tab ? (
                    <Box key={i} className="rounded-b-none px-3 pt-2 pb-1">
                      {t(`${key}.title`)}
                    </Box>
                  ) : (
                    <button
                      key={i}
                      className="rounded-t-lg px-3 pt-2 pb-1 hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner "
                      onClick={() => {
                        setTab(i);
                        ref.current.focus();
                      }}
                    >
                      {t(`${key}.title`)}
                    </button>
                  ),
                )}
              </div>
              <Box
                className={
                  "p-3 overflow-auto " +
                  "min-h-96 relative " +
                  "edit-wide:flex-1 edit-wide:min-h-0"
                }
              >
                {tab === 0 ? (
                  <MetaTab
                    saveEditSession={props.saveEditSession}
                    sessionId={sessionId}
                    sessionData={sessionData}
                    chartNumEvent={chartNumEvent}
                    chart={chart}
                    setChart={changeChart}
                    convertedFrom={convertedFrom}
                    setConvertedFrom={setConvertedFrom}
                    cid={cid}
                    setCid={(newCid: string) => setCid(newCid)}
                    hasChange={hasChange}
                    setHasChange={setHasChange}
                    currentLevelIndex={currentLevelIndex}
                    locale={locale}
                    currentPasswd={props.currentPasswd}
                    newPasswd={newPasswd}
                    setNewPasswd={setNewPasswd}
                    savePasswd={!!savePasswd}
                    setSavePasswd={setSavePasswd}
                  />
                ) : tab === 1 ? (
                  <TimingTab
                    offset={chart?.offset}
                    setOffset={changeOffset}
                    currentLevel={currentLevel}
                    prevBpm={
                      currentBpmIndex !== undefined && currentBpmIndex >= 1
                        ? currentLevel?.bpmChanges[currentBpmIndex - 1].bpm
                        : undefined
                    }
                    currentBpmIndex={currentBpmIndex}
                    currentBpm={
                      currentBpmIndex !== undefined ? currentBpm : undefined
                    }
                    setCurrentBpm={changeBpm}
                    bpmChangeHere={!!bpmChangeHere}
                    toggleBpmChangeHere={toggleBpmChangeHere}
                    prevSpeed={
                      currentSpeedIndex !== undefined && currentSpeedIndex >= 1
                        ? currentLevel?.speedChanges[currentSpeedIndex - 1].bpm
                        : undefined
                    }
                    currentSpeedIndex={currentSpeedIndex}
                    currentSpeed={
                      currentSpeedIndex !== undefined ? currentSpeed : undefined
                    }
                    speedChangeHere={!!speedChangeHere}
                    prevSignature={prevSignature}
                    currentSignature={currentSignature}
                    setCurrentSignature={changeSignature}
                    signatureChangeHere={!!signatureChangeHere}
                    toggleSignatureChangeHere={toggleSignatureChangeHere}
                    currentStep={currentStep}
                  />
                ) : tab === 2 ? (
                  <LevelTab
                    chart={chart}
                    currentLevelIndex={currentLevelIndex}
                    setCurrentLevelIndex={setCurrentLevelIndex}
                    changeChart={changeChart}
                  />
                ) : tab === 3 ? (
                  <NoteTab
                    currentNoteIndex={currentNoteIndex}
                    hasCurrentNote={hasCurrentNote}
                    notesIndexInStep={notesIndexInStep}
                    notesCountInStep={notesCountInStep}
                    canAddNote={canAddNote}
                    addNote={addNote}
                    deleteNote={deleteNote}
                    updateNote={updateNote}
                    copyNote={copyNote}
                    pasteNote={pasteNote}
                    hasCopyBuf={copyBuf.map((n) => n !== null)}
                    currentStep={currentStep}
                    currentLevel={currentLevel}
                  />
                ) : null}
                <LuaTabPlaceholder
                  visible={tab === 4}
                  currentLine={currentLine}
                  currentStepStr={currentStepStr}
                  barLines={barLines}
                  currentLevel={currentLevel}
                  changeLevel={changeLevel}
                  seekStepAbs={seekStepAbs}
                  errLine={luaExecutor.running ? null : luaExecutor.errLine}
                  err={luaExecutor.err}
                />
              </Box>
              <div
                className={
                  "bg-slate-200 dark:bg-stone-700 mt-2 rounded-sm " +
                  "h-24 max-h-24 edit-wide:h-auto overflow-auto "
                }
              >
                {luaExecutor.running ? (
                  <div className="m-1">
                    <span className="inline-block ">
                      <SlimeSVG />
                      {t("running")}
                    </span>
                    <Button
                      className="ml-2"
                      onClick={luaExecutor.abortExec}
                      text={t("cancel")}
                    />
                  </div>
                ) : (
                  (luaExecutor.stdout.length > 0 ||
                    luaExecutor.err.length > 0) && (
                    <div className="m-1">
                      {luaExecutor.stdout.map((s, i) => (
                        <p className="text-sm" key={i}>
                          {s}
                        </p>
                      ))}
                      {luaExecutor.err.map((e, i) => (
                        <p
                          className="text-sm text-red-600 dark:text-red-400 "
                          key={i}
                        >
                          {e}
                        </p>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </LuaTabProvider>
      </CaptionProvider>
    </main>
  );
}
