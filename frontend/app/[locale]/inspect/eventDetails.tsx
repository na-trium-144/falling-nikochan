import {
  ChartSeqData,
  getBarLength,
  Signature,
  Step,
  stepCmp,
  stepImproper,
} from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

function formatSignature(sig: Signature): string {
  const barLengths = getBarLength(sig);
  return barLengths
    .map((len) => `${stepImproper(len)}/${len.denominator * 4}`)
    .join(" + ");
}

interface Props {
  chartSeq: ChartSeqData | undefined;
  isNoteSelected: (n: { step: Step }) => boolean;
  currentStep: Step;
}
export function EventDetails(props: Props) {
  const { chartSeq, isNoteSelected, currentStep } = props;
  const t = useTranslations("inspect");

  const notesBigId: (number | null)[] = useMemo(() => {
    const notesBigId: (number | null)[] = [];
    let id = 0;
    for (const n of chartSeq?.notes ?? []) {
      if (n.big) {
        notesBigId[n.id] = id;
        id++;
      }
    }
    return notesBigId;
  }, [chartSeq]);
  const bigCount = useMemo(
    () => chartSeq?.notes.filter((n) => n.big).length,
    [chartSeq]
  );

  // 選択中の音符（現在カーソル位置と一致する音符）
  const selectedNotes = useMemo(
    () => chartSeq?.notes.filter((n) => isNoteSelected(n)) || [],
    [chartSeq, isNoteSelected]
  );

  const selectedBpmChanges = useMemo(() => {
    if (!chartSeq) return [];
    return chartSeq.bpmChanges.filter(
      (b) => stepCmp(b.step, currentStep) === 0
    );
  }, [chartSeq, currentStep]);

  const selectedSpeedChanges = useMemo(() => {
    if (!chartSeq) return [];
    const results: (
      | { type: "direct"; bpm: number }
      | { type: "interp"; prevBpm: number; bpm: number }
    )[] = [];
    for (let i = 0; i < chartSeq.speedChanges.length; i++) {
      const s = chartSeq.speedChanges[i];
      if (s.interp && i > 0) {
        const prev = chartSeq.speedChanges[i - 1];
        if (
          stepCmp(currentStep, prev.step) > 0 &&
          stepCmp(currentStep, s.step) <= 0
        ) {
          results.push({
            type: "interp",
            prevBpm: prev.bpm,
            bpm: s.bpm,
          });
        }
      } else {
        if (stepCmp(s.step, currentStep) === 0) {
          results.push({
            type: "direct",
            bpm: s.bpm,
          });
        }
      }
    }
    return results;
  }, [chartSeq, currentStep]);

  const selectedSignatureChanges = useMemo(() => {
    if (!chartSeq) return [];
    return chartSeq.signature.filter(
      (sig) => stepCmp(sig.step, currentStep) === 0
    );
  }, [chartSeq, currentStep]);

  return (
    <>
      {selectedNotes.length === 0 &&
        selectedBpmChanges.length === 0 &&
        selectedSpeedChanges.length === 0 &&
        selectedSignatureChanges.length === 0 && (
          <span className="text-dim">{t("noSelection")}</span>
        )}
      {selectedBpmChanges.map((b, i) => (
        <div key={`bpm-${i}`} className="flex items-center justify-between">
          <span className="text-sm mr-2">{t("bpmChange")}:</span>
          <span>{b.bpm}</span>
        </div>
      ))}
      {selectedSpeedChanges.map((s, i) => (
        <div key={`speed-${i}`} className="flex items-center justify-between">
          <span className="text-sm mr-2">{t("speedChange")}:</span>
          <span>{s.type === "interp" ? `${s.prevBpm} → ${s.bpm}` : s.bpm}</span>
        </div>
      ))}
      {selectedSignatureChanges.map((sig, i) => (
        <div key={`sig-${i}`} className="flex items-center justify-between">
          <span className="text-sm mr-2">{t("signatureChange")}:</span>
          <span>{formatSignature(sig)}</span>
        </div>
      ))}
      {selectedNotes.map((note) => (
        <div key={note.id} className="flex items-center justify-end flex-wrap">
          <span>#</span>
          <span className="ml-1 min-w-6">{note.id + 1}</span>
          {note.big && (
            <span className="text-sm ml-2">
              (Big#
              <span className="ml-1">{notesBigId[note.id]! + 1}</span>)
            </span>
          )}
          <span className="flex-1" />
          <span className="ml-2">
            <span className="text-sm text-dim mr-1">
              <var className="italic">x</var>:
            </span>
            <span className="inline-block min-w-6 text-center">
              {note.hitX}
            </span>
          </span>
          <span className="ml-2">
            <span className="text-sm text-dim mr-1">
              <var className="italic">vx</var>:
            </span>
            <span className="inline-block min-w-6 text-center">
              {note.hitVX}
            </span>
          </span>
          <span className="ml-2">
            <span className="text-sm text-dim mr-1">
              <var className="italic">vy</var>:
            </span>
            <span className="inline-block min-w-6 text-center">
              {note.hitVY}
            </span>
          </span>
        </div>
      ))}
      <hr className="fn-hr my-1" />
      <div className="flex items-center">
        <span className="ml-2">/</span>
        <span className="ml-1 min-w-8 text-center">
          {chartSeq?.notes.length}
        </span>
        <span className="text-sm ml-2">
          (Big<span className="text-sm ml-1">{bigCount}</span>)
        </span>
      </div>
    </>
  );
}
