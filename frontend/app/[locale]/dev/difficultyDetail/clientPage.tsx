"use client";

import { Box } from "@/common/box";
import { fetchBackend } from "@/common/fetch";
import { MobileFooter } from "@/common/footer";
import { MobileHeader } from "@/common/header";
import Input from "@/common/input";
import {
  BPMChangeWithTimeSec,
  ChartBrief,
  CidSchema,
  getTimeSec,
  Level15Play,
  Level6Play,
  LevelPlay,
  maxLv,
  minLv,
  NoteCommand,
  NoteCommand3,
  agentsPlay,
  lvToNps,
  updateBpmTimeSec,
} from "@falling-nikochan/chart";
import clsx from "clsx/lite";
import { Fragment, useState } from "react";
import * as v from "valibot";
import * as msgpack from "@msgpack/msgpack";

export function ClientPage(props: { locale: string }) {
  const [inputCId, setInputCId] = useState<string>("");
  const [cidErrorMsg, setCIdErrorMsg] = useState<Error>();
  const [brief, setBrief] = useState<ChartBrief>();
  const [details, setDetails] = useState<(DifficultyResult | undefined)[]>([]);
  const gotoCId = async (cid: string) => {
    await fetchBackend()
      .url(`/api/brief/${cid}`)
      .options({
        cache: "no-cache",
      })
      .get()
      .json(async (brief: ChartBrief) => {
        setCIdErrorMsg(undefined);
        setInputCId(cid);
        setDetails([]);
        setBrief(brief);
        setDetails(
          await Promise.all(
            brief.levels.map((l, i) => {
              if (!l.unlisted) {
                return fetchBackend()
                  .url(`/api/playFile/${cid}/${i}`)
                  .options({ cache: "no-cache" })
                  .get()
                  .arrayBuffer((buf) => {
                    const playFile = msgpack.decode(buf) as
                      Level6Play | Level15Play | LevelPlay;
                    const { bpm } = updateBpmTimeSec(playFile.bpmChanges);
                    // 計算ロジックはdifficulty.tsからこのファイルにコピペ・改変しており、追従はしない
                    return calculateAllDifficulties({
                      notes: playFile.notes,
                      bpmChanges: bpm,
                    });
                  });
              }
            })
          )
        );
      })
      .catch((e: Error) => {
        setCIdErrorMsg(e);
      });
  };

  return (
    <main className="w-full h-full overflow-clip ">
      <div className="flex flex-col w-full h-full items-center text-center">
        <MobileHeader className="no-pc">Difficulty Detail</MobileHeader>
        <div
          className={clsx(
            "flex-1 min-h-0 w-full px-6 main-wide:pt-3 main-wide:px-6",
            "flex items-center justify-center"
          )}
        >
          <Box
            classNameOuter="w-max h-max max-w-full max-h-full"
            classNameInner="space-y-3"
            scrollableY
            padding={6}
          >
            <div className="no-mobile mb-3 text-center fn-heading-sect">
              Difficulty Detail
            </div>
            <div>
              <span>chart ID:</span>
              <Input
                className="ml-4 w-20"
                actualValue={inputCId}
                updateValue={gotoCId}
                isValid={(t) => v.safeParse(CidSchema(), t).success}
                left
              />
            </div>
            {cidErrorMsg instanceof Error && <div>{String(cidErrorMsg)}</div>}
            <div className="text-sm text-dim">
              <div>clv: 80点に到達するために必要な連打速度基準</div>
              <div>plv: 99点に到達するために必要な連打速度基準</div>
              <div>
                alv: (clv + plv) / 2 (+ 5点押し以上の場合ペナルティ) → 四捨五入
              </div>
            </div>
            <hr className="fn-hr my-3" />
            {brief && (
              <>
                <div>Title: {brief?.title}</div>
                <div>Composer: {brief?.composer}</div>
                <div>Chart Creator: {brief?.chartCreator}</div>
                {details.map(
                  (d, i) =>
                    d && (
                      <Fragment key={i}>
                        <hr className="fn-hr my-3" />
                        <div>
                          [{i}] {brief.levels[i].name} {brief.levels[i].type}-
                          {brief.levels[i].difficulty}
                        </div>
                        {Array.from(d.values()).map((h) => (
                          <div
                            key={h.baseHit}
                            className={clsx(
                              "space-x-2 text-sm w-max mx-auto",
                              ((h.baseHit === 1 &&
                                brief.levels[i].type === "Single") ||
                                (h.baseHit === 2 &&
                                  brief.levels[i].type === "Double") ||
                                (h.baseHit >= 4 &&
                                  brief.levels[i].type === "Maniac" &&
                                  Math.round(h.alv + h.additional) ===
                                    brief.levels[i].difficulty)) &&
                                "font-bold italic border-b-1"
                            )}
                          >
                            <span>{h.baseHit}</span>
                            {h.baseHit === 1 ? (
                              <span>(Single)</span>
                            ) : h.baseHit === 2 ? (
                              <span>(Double)</span>
                            ) : null}
                            <span>:</span>
                            <span>clv={h.clv}</span>
                            <span>plv={h.plv}</span>
                            <span>alv={h.alv}</span>
                            {h.additional > 0 && <span>+{h.additional}</span>}
                            {h.reason === "empty_notes" ? (
                              <span>(音符がないため)</span>
                            ) : h.reason === "clv_cutoff" ? (
                              <span>
                                (plv ≧ clv + 4 のため clv + 2 で打ち切り)
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </Fragment>
                    )
                )}
              </>
            )}
          </Box>
        </div>
        <div className="flex-none basis-mobile-footer no-pc" />
      </div>
      <MobileFooter
        className="fixed bottom-0"
        blurBg
        locale={props.locale}
        tabKey={null}
      />
    </main>
  );
}

export interface HitDetail {
  baseHit: number;
  clv: number | null;
  plv: number | null;
  alv: number;
  additional: number;
  reason:
    | "empty_notes"
    | "both_reached" // clv, plv双方が確定し平均から算出
    | "clv_cutoff" // clv確定後+4Lv探索してもplvが出ず clv+2 で打ち切り
    | "upper_bound_reached"; // alvまたはmaxLv上限に達したため打ち切り
}

export type DifficultyResult = Map<number, HitDetail>;

export function calculateAllDifficulties(level: {
  notes: NoteCommand[] | NoteCommand3[];
  bpmChanges: BPMChangeWithTimeSec[];
}): DifficultyResult {
  const details = new Map<number, HitDetail>();

  // ノーツが空の場合の初期リターン
  if (level.notes.length === 0) {
    details.set(0, {
      baseHit: 0,
      clv: null,
      plv: null,
      alv: minLv,
      additional: 0,
      reason: "empty_notes",
    });

    return details;
  }

  const notesHitSec = level.notes.map((n) =>
    getTimeSec(level.bpmChanges, n.step)
  );

  // 指定された baseHit での探索を行うヘルパー関数
  function evaluateHit(
    currentBaseHit: number,
    additionalHitOffset: number,
    // currentAlv: number | null
  ): HitDetail {
    let clv: number | null = null;
    let plv: number | null = null;
    // const effectiveLimit = currentAlv || maxLv;

    for (let lv = 1; ; lv += 0.5) {
      // if (clv === null && lv + additionalHitOffset >= maxLv) {
      //   return {
      //     baseHit: currentBaseHit,
      //     clv,
      //     plv,
      //     alv: lv,
      //     additional: additionalHitOffset,
      //     reason: "upper_bound_reached",
      //   };
      // }

      const agentScore = agentsPlay(
        level,
        currentBaseHit,
        notesHitSec,
        lvToNps(lv, currentBaseHit)
      );

      if (agentScore >= 80 && clv === null) {
        clv = lv;
      }
      if (agentScore >= 99 && plv === null) {
        plv = lv;
      }

      // 80% と 99% の双方が判明
      if (clv !== null && plv !== null) {
        const rawLv = (clv + plv) / 2 + additionalHitOffset;
        return {
          baseHit: currentBaseHit,
          clv,
          plv,
          alv: rawLv - additionalHitOffset,
          additional: additionalHitOffset,
          reason: "both_reached",
        };
      }

      // clv から +4Lv 上げても plv に届かない場合のカットオフ
      if (clv !== null && lv >= clv + 4) {
        const rawLv = clv + 2 + additionalHitOffset;
        return {
          baseHit: currentBaseHit,
          clv,
          plv,
          alv: rawLv - additionalHitOffset,
          additional: additionalHitOffset,
          reason: "clv_cutoff",
        };
      }
    }
  }

  // 1. Single (baseHit = 1)
  const singleDetail = evaluateHit(1, 0);
  details.set(1, singleDetail);

  // 2. Double (baseHit = 2)
  const doubleDetail = evaluateHit(2, 0);
  details.set(2, doubleDetail);

  // 3. Multi (baseHit = 4, 5, 6, ...)
  // additionalHit (0, 1, ...) を増やしながら難易度 alv を更新していく
  let multiAlv: number | null = null;
  const startBaseHit = 4;

  for (
    let additionalHit = 0;
    multiAlv === null || additionalHit < multiAlv;
    additionalHit++
  ) {
    const currentBaseHit = startBaseHit + additionalHit;
    const detail = evaluateHit(currentBaseHit, additionalHit);

    const effectiveLimit = multiAlv || maxLv;
    multiAlv = Math.min(detail.alv + detail.additional, effectiveLimit);
    details.set(currentBaseHit, detail);
  }

  return details;
}
