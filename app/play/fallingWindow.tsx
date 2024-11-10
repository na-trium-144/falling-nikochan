"use client";

import { useEffect, useRef, useState } from "react";
import {
  Note,
  DisplayNote,
  targetY,
  displayNote,
  bigScale,
} from "@/chartFormat/seq";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine";
import { useDisplayMode } from "@/scale";
import { bonusMax } from "@/common/gameConstant";

interface Props {
  className?: string;
  style?: object;
  notes: Note[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
  barFlash: boolean;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS } = props;
  const [displayNotes, setDisplayNotes] = useState<DisplayNote[]>([]);
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;
  const fpsCount = useRef<number>(0);
  const fpsCountBegin = useRef<Date>(new Date());

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.05 * (boxSize || 0));

  useEffect(() => {
    let anim: number;
    const update = () => {
      const now = getCurrentTimeSec();
      if (
        playing &&
        marginX !== undefined &&
        marginY !== undefined &&
        boxSize &&
        now !== undefined
      ) {
        setDisplayNotes(
          notes.map((n) => displayNote(n, now)).filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }

      fpsCount.current++;
      if (new Date().getTime() - fpsCountBegin.current.getTime() >= 1000) {
        setFPS && setFPS(fpsCount.current);
        fpsCountBegin.current = new Date();
        fpsCount.current = 0;
      }
      anim = requestAnimationFrame(update);
    };
    anim = requestAnimationFrame(update);
    return () => cancelAnimationFrame(anim);
  }, [notes, playing, getCurrentTimeSec, marginX, marginY, boxSize, setFPS]);

  return (
    <div className={props.className} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {/* 判定線 */}
        {boxSize && marginY !== undefined && (
          <TargetLine
            barFlash={props.barFlash}
            left={0}
            right="-100%"
            bottom={targetY * boxSize + marginY}
          />
        )}
        {displayNotes.map(
          (d) =>
            boxSize &&
            marginX !== undefined &&
            marginY !== undefined && (
              <Nikochan
                key={d.id}
                displayNote={d}
                note={notes[d.id]}
                noteSize={noteSize}
                marginX={marginX}
                marginY={marginY}
                boxSize={boxSize}
              />
            )
        )}
      </div>
    </div>
  );
}

interface NProps {
  displayNote: DisplayNote;
  noteSize: number;
  note: Note;
  marginX: number;
  marginY: number;
  boxSize: number;
}
function Nikochan(props: NProps) {
  /* にこちゃん
  d.done に応じて画像と動きを変える
  0: 通常
  1〜3: good, ok, bad
  4: miss は画像が0と同じ
  */
  const { displayNote, noteSize, marginX, marginY, boxSize, note } = props;

  const particleMaxNum = 15;
  const particleNum =
    displayNote.chain && displayNote.baseScore !== undefined
      ? Math.min(
          Math.round(
            ((1 + (2 * displayNote.chain) / bonusMax) / 3) *
              particleMaxNum *
              displayNote.baseScore
          ),
          particleMaxNum
        )
      : 0;
  const [particleStartAngle, setParticleStartAngle] = useState<number>();
  useEffect(() => {
    setParticleStartAngle(Math.random() * 360);
  }, []);

  return (
    <>
      <div
        className={
          "absolute " +
          (displayNote.done === 0
            ? ""
            : displayNote.done === 1
            ? "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125"
            : displayNote.done === 2
            ? "transition ease-linear duration-300 -translate-y-2 opacity-0"
            : displayNote.done === 3
            ? "transition ease-linear duration-300 opacity-0"
            : "")
        }
        style={{
          /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
          width: noteSize * bigScale(note.big),
          height: noteSize * bigScale(note.big),
          left:
            displayNote.pos.x * boxSize -
            (noteSize * bigScale(note.big)) / 2 +
            marginX,
          bottom:
            displayNote.pos.y * boxSize +
            targetY * boxSize -
            (noteSize * bigScale(note.big)) / 2 +
            marginY,
        }}
      >
        <img
          src={`/nikochan${displayNote.done <= 3 ? displayNote.done : 0}.svg`}
          className="w-full h-full "
        />
        {/* chainBonusをにこちゃんの右上に表示する */}
        {/*{displayNote.baseScore !== undefined &&
          displayNote.chainBonus !== undefined &&
          displayNote.chain && (
            <span
              className={
                "absolute w-12 text-xs " +
                (displayNote.chain >= 100 || displayNote.bigDone
                  ? "text-orange-500 "
                  : "")
              }
              style={{ bottom: "100%", left: "100%" }}
            >
              ×{" "}
              {(
                displayNote.baseScore +
                displayNote.chainBonus +
                (displayNote.bigBonus || 0)
              ).toFixed(2)}
            </span>
          )}*/}
      </div>
      {particleStartAngle !== undefined &&
        particleNum > 0 &&
        Array.from(new Array(particleNum /*particleMaxNum*/)).map((_, i) => (
          <Particle
            key={i}
            angle={particleStartAngle + (360 * i) / particleNum}
            visible={i < particleNum}
            left={note.targetX * boxSize + marginX}
            bottom={targetY * boxSize + marginY}
            noteSize={noteSize}
            big={displayNote.bigDone}
            chain={displayNote.chain || 0}
          />
        ))}
    </>
  );
}

interface PProps {
  angle: number;
  left: number;
  bottom: number;
  noteSize: number;
  visible: boolean;
  big: boolean;
  chain: number;
}
function Particle(props: PProps) {
  const ref = useRef<HTMLDivElement>(null!);
  const animateDone = useRef<boolean>(false);
  const angleRandom = useRef<number>(0);
  const bigParam = useRef<number>(1);
  const sizeParam = useRef<number>(1);
  const hueParam = useRef<number>(0);
  const hue =
    55 - (15 * hueParam.current * Math.min(props.chain, bonusMax)) / bonusMax;
  const { noteSize } = props;
  const particleSize = (noteSize / 4) * sizeParam.current;
  useEffect(() => {
    if (!animateDone.current) {
      const distance = noteSize * (0.5 + Math.random() * Math.random() * 1);
      ref.current.animate(
        [
          { transform: "translateX(0px)", opacity: 1 },
          {
            transform: `translateX(${distance * 0.8}px)`,
            opacity: 1,
            offset: 0.8,
          },
          { transform: `translateX(${distance}px)`, opacity: 0 },
        ],
        { duration: 500, fill: "forwards", easing: "ease-out" }
      );
      angleRandom.current = Math.random() * Math.random() * 120;
      bigParam.current = Math.random() * 1 + 1;
      sizeParam.current = Math.random() * Math.random() * 0.5 + 0.5;
      hueParam.current = Math.random() * Math.random() * 1;
    }
    animateDone.current = true;
  }, [noteSize]);
  return (
    <div
      className="absolute -z-10 "
      style={{
        width: 1,
        height: 1,
        left: props.left,
        bottom: props.bottom,
        transform:
          `rotate(${props.angle + angleRandom.current}deg) ` +
          `scale(${props.big ? bigParam.current : 1})`,
        opacity: props.visible ? 1 : 0,
      }}
    >
      <div
        ref={ref}
        className="absolute rounded-full "
        style={{
          background: `hsl(${hue} 100% 50%)`,
          width: particleSize,
          height: particleSize,
          left: -particleSize / 2,
          bottom: -particleSize / 2,
        }}
      />
    </div>
  );
}
