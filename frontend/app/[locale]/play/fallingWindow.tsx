"use client";

import { useEffect, useRef, useState } from "react";
import { targetY, bigScale } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { ThemeContext } from "@/common/theme.js";
import {
  displayNote6,
  DisplayNote6,
  Note6,
} from "@falling-nikochan/chart";
import {
  displayNote7,
  DisplayNote7,
  Note7,
} from "@falling-nikochan/chart";

interface Props {
  className?: string;
  style?: object;
  notes: Note6[] | Note7[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
  barFlash: boolean;
  themeContext: ThemeContext;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS } = props;
  const [displayNotes, setDisplayNotes] = useState<
    DisplayNote6[] | DisplayNote7[]
  >([]);
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
          notes
            .map((n) =>
              n.ver === 6 ? displayNote6(n, now) : displayNote7(n, now)
            )
            .filter((n) => n !== null)
        );
      } else {
        setDisplayNotes([]);
      }

      fpsCount.current++;
      if (new Date().getTime() - fpsCountBegin.current.getTime() >= 1000) {
        if (setFPS) {
          setFPS(fpsCount.current);
        }
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
                themeContext={props.themeContext}
              />
            )
        )}
      </div>
    </div>
  );
}

interface NProps {
  displayNote: DisplayNote6 | DisplayNote7;
  noteSize: number;
  note: Note6 | Note7;
  marginX: number;
  marginY: number;
  boxSize: number;
  themeContext: ThemeContext;
}
function Nikochan(props: NProps) {
  /* にこちゃん
  d.done に応じて画像と動きを変える
  0: 通常
  1〜3: good, ok, bad
  4: miss は画像が0と同じ
  */
  const { displayNote, noteSize, marginX, marginY, boxSize, note } = props;

  // const particleMaxNum = 15;
  // const particleNum =
  //   displayNote.chain && displayNote.baseScore !== undefined
  //     ? Math.min(
  //         Math.round(
  //           ((1 + (2 * displayNote.chain) / bonusMax) / 3) *
  //             particleMaxNum *
  //             displayNote.baseScore
  //         ),
  //         particleMaxNum
  //       )
  //     : 0;
  // const [particleStartAngle, setParticleStartAngle] = useState<number>();
  // useEffect(() => {
  //   setParticleStartAngle(Math.random() * 360);
  // }, []);

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
          src={
            process.env.ASSET_PREFIX +
            `/assets/nikochan${
              displayNote.done <= 3 ? displayNote.done : 0
            }.svg`
          }
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
      {/*false &&[1, 2].includes(displayNote.done) && (
        <Ripple
          noteSize={noteSize}
          left={note.targetX * boxSize + marginX}
          bottom={targetY * boxSize + marginY}
          big={displayNote.bigDone}
          chain={displayNote.chain || 0}
        />
      )}
      {particleStartAngle !== undefined &&
        particleNum > 0 &&
        Array.from(new Array(particleNum /*particleMaxNum/)).map((_, i) => (
          <Particle
            key={i}
            angle={particleStartAngle + (360 * i) / particleNum}
            visible={i < particleNum}
            left={note.targetX * boxSize + marginX}
            bottom={targetY * boxSize + marginY}
            noteSize={noteSize}
            big={displayNote.bigDone}
            chain={displayNote.chain || 0}
            themeContext={props.themeContext}
          />
        ))*/}
    </>
  );
}

/*interface RProps {
  noteSize: number;
  left: number;
  bottom: number;
  big: boolean;
  chain: number;
}
function Ripple(props: RProps) {
  const ref = useRef<HTMLDivElement>(null!);
  const ref2 = useRef<HTMLDivElement>(null!);
  const animateDone = useRef<boolean>(false);
  const { noteSize } = props;
  const rippleWidth = noteSize * 1.5 * (props.big ? 1.5 : 1);
  const rippleHeight = rippleWidth * 0.6;
  useEffect(() => {
    if (!animateDone.current) {
      [ref, ref2].forEach((r, i) => {
        r.current.animate(
          [
            { transform: "scale(0)", opacity: 0.6 },
            { transform: "scale(0.8)", opacity: 0.6, offset: 0.8 },
            { transform: `scale(1)`, opacity: 0 },
          ],
          {
            duration: 500 - 200 * i,
            delay: 200 * i,
            fill: "forwards",
            easing: "ease-out",
          }
        );
      });
    }
    animateDone.current = true;
  }, [noteSize]);
  return (
    <div
      className="absolute -z-20 "
      style={{
        width: 1,
        height: 1,
        left: props.left,
        bottom: props.bottom,
      }}
    >
      {[ref, ref2].map((r, i) => (
        <div
          key={i}
          ref={r}
          className={
            "absolute origin-center scale-0 " +
            (props.chain >= bonusMax
              ? "bg-amber-200 border-amber-300 dark:bg-yellow-700 dark:border-yellow-600 "
              : "bg-yellow-200 border-yellow-300 dark:bg-amber-700 dark:border-amber-600 ")
          }
          style={{
            borderWidth: rippleWidth / 20,
            borderRadius: "50%",
            width: rippleWidth,
            height: rippleHeight,
            left: -rippleWidth / 2,
            bottom: -rippleHeight / 2,
          }}
        />
      ))}
    </div>
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
  themeContext: ThemeContext;
}
function Particle(props: PProps) {
  const ref = useRef<HTMLDivElement>(null!);
  const animateDone = useRef<boolean>(false);
  const angleRandom = useRef<number>(0);
  const bigParam = useRef<number>(1);
  const sizeParam = useRef<number>(1);
  const hueParam = useRef<number>(0);
  let hue =
    55 - (15 * hueParam.current * Math.min(props.chain, bonusMax)) / bonusMax;
  if (props.themeContext.isDark) {
    hue = 85 - hue;
  }
  const { noteSize } = props;
  const particleSize = (noteSize / 4) * sizeParam.current;
  useEffect(() => {
    if (!animateDone.current) {
      const distance = noteSize * (0.5 + Math.random() * Math.random() * 1);
      ref.current.animate(
        [
          { transform: "translateX(0px)", opacity: 0.8 },
          {
            transform: `translateX(${distance * 0.8}px)`,
            opacity: 0.8,
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
*/