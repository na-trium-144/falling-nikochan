"use client";

import { memo, RefObject, useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote7, DisplayNote7, Note7 } from "@falling-nikochan/chart";

interface Props {
  className?: string;
  style?: object;
  notes: Note6[] | Note7[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
  limitMaxFPS: number;
  barFlash: boolean;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS, limitMaxFPS } = props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  const [rerenderIndex, setRerenderIndex] = useState<number>(0);
  const fpsCounter = useRef<DOMHighResTimeStamp[]>([]);
  useEffect(() => {
    let animFrame: number;
    const updateLoop = () => {
      setRerenderIndex((r) => r + 1);
      animFrame = requestAnimationFrame(updateLoop);
    };
    animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, []);
  useEffect(() => {
    if (setFPS) {
      const i = setInterval(() => {
        while (
          fpsCounter.current.at(0) &&
          fpsCounter.current.at(-1)! - fpsCounter.current.at(0)! > 1000
        ) {
          fpsCounter.current.shift();
        }
        setFPS!(fpsCounter.current.length);
      }, 100);
      return () => clearInterval(i);
    }
  }, [setFPS]);

  const displayNotes = useRef<DisplayNote6[] | DisplayNote7[]>([]);
  const prevRerenderIndex = useRef<number>(-1);
  const prevRerender = useRef<DOMHighResTimeStamp | null>(null);
  if (
    prevRerenderIndex.current !== rerenderIndex &&
    (prevRerender.current === null ||
      limitMaxFPS === 0 ||
      performance.now() - prevRerender.current > 1000 / (limitMaxFPS * 1.1))
  ) {
    performance.mark("nikochan-rerender");
    const nowDate = performance.now();
    fpsCounter.current.push(nowDate);
    if (
      prevRerender.current === null ||
      limitMaxFPS === 0 ||
      // reset clock if rendering is too late
      performance.now() - prevRerender.current > (1000 / limitMaxFPS) * 3
    ) {
      prevRerender.current = nowDate;
    } else {
      prevRerender.current += 1000 / limitMaxFPS;
    }
    prevRerenderIndex.current = rerenderIndex;
    const now = getCurrentTimeSec();
    if (
      playing &&
      marginX !== undefined &&
      marginY !== undefined &&
      boxSize &&
      now !== undefined
    ) {
      displayNotes.current = notes
        .map((n) => (n.ver === 6 ? displayNote6(n, now) : displayNote7(n, now)))
        .filter((n) => n !== null);
    } else {
      displayNotes.current = [];
    }
  }

  const nikochanAssets = useRef<string[]>([]);
  const particleAssets = useRef<string[]>([]);
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map((i) =>
        fetch(process.env.ASSET_PREFIX + `/assets/nikochan${i}.svg`)
          .then((res) => res.text())
          .then((text) => `data:image/svg+xml;base64,${btoa(text)}`)
      )
    ).then((urls) => {
      nikochanAssets.current = urls;
    });
    Promise.all(
      Array.from(new Array(13)).map((_, i) =>
        [4, 6, 8, 10, 12].includes(i)
          ? fetch(process.env.ASSET_PREFIX + `/assets/particle${i}.svg`)
              .then((res) => res.text())
              .then((text) => `data:image/svg+xml;base64,${btoa(text)}`)
          : ""
      )
    ).then((urls) => {
      particleAssets.current = urls;
    });
  }, []);

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
        {boxSize && marginX !== undefined && marginY !== undefined && (
          <NikochansMemo
            displayNotes={displayNotes.current}
            notes={notes}
            noteSize={noteSize}
            boxSize={boxSize}
            marginX={marginX}
            marginY={marginY}
            nikochanAssets={nikochanAssets}
            particleAssets={particleAssets}
          />
        )}
      </div>
    </div>
  );
}

interface MProps {
  displayNotes: DisplayNote6[] | DisplayNote7[];
  notes: Note6[] | Note7[];
  noteSize: number;
  boxSize: number;
  marginX: number;
  marginY: number;
  nikochanAssets: RefObject<string[]>;
  particleAssets: RefObject<string[]>;
}
const NikochansMemo = memo(function Nikochans(props: MProps) {
  return props.displayNotes.map((d) => (
    <Nikochan
      key={d.id}
      displayNote={d}
      note={props.notes[d.id]}
      noteSize={props.noteSize}
      marginX={props.marginX}
      marginY={props.marginY}
      boxSize={props.boxSize}
      nikochanAssets={props.nikochanAssets}
      particleAssets={props.particleAssets}
    />
  ));
});

interface NProps {
  displayNote: DisplayNote6 | DisplayNote7;
  noteSize: number;
  note: Note6 | Note7;
  marginX: number;
  marginY: number;
  boxSize: number;
  nikochanAssets: RefObject<string[]>;
  particleAssets: RefObject<string[]>;
}
function Nikochan(props: NProps) {
  /* にこちゃん
  d.done に応じて画像と動きを変える
  0: 通常
  1〜3: good, ok, bad
  4: miss は画像が0と同じ
  */
  const { displayNote, noteSize, marginX, marginY, boxSize, note } = props;

  const [enableFadeIn, setEnableFadeIn] = useState<boolean>(true);
  const [appeared, setAppeared] = useState<boolean>(false);
  useEffect(() => {
    const x = displayNote.pos.x * boxSize + marginX;
    const y = displayNote.pos.y * boxSize + targetY * boxSize + marginY;
    const size = noteSize * bigScale(note.big);
    const isOffScreen =
      x + size / 2 < 0 ||
      x - size / 2 > window.innerWidth ||
      y - size / 2 > boxSize ||
      y + size / 2 < 0;
    if (isOffScreen) {
      setEnableFadeIn(false);
    } else {
      // set appeared after rendering next frame to ensure fade transition
      requestAnimationFrame(() => setAppeared(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <div
        className={
          "absolute " +
          (displayNote.done === 0
            ? enableFadeIn
              ? appeared
                ? "transition ease-linear duration-100 opacity-100"
                : "opacity-0"
              : "opacity-100"
            : displayNote.done === 1
              ? "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125"
              : displayNote.done === 2
                ? "transition ease-linear duration-300 -translate-y-2 opacity-0"
                : displayNote.done === 3
                  ? "transition ease-linear duration-300 opacity-0"
                  : displayNote.done === 4
                    ? "transition ease-linear duration-200 opacity-0"
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
          decoding="async"
          src={
            props.nikochanAssets.current[
              displayNote.done <= 3 ? displayNote.done : 0
            ]
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
      {[1].includes(displayNote.done) && (
        <Ripple
          noteSize={noteSize}
          left={note.targetX * boxSize + marginX}
          bottom={targetY * boxSize + marginY}
          big={displayNote.bigDone}
          chain={displayNote.chain || 0}
        />
      )}
      {displayNote.chain && [1, 2].includes(displayNote.done) && (
        <Particle
          particleNum={
            // 6,8,10,12
            6 + Math.floor(3 * Math.min(1, displayNote.chain / bonusMax)) * 2
          }
          left={note.targetX * boxSize + marginX}
          bottom={targetY * boxSize + marginY}
          noteSize={noteSize}
          big={!!displayNote.bigBonus}
          chain={displayNote.chain || 0}
          particleAssets={props.particleAssets}
        />
      )}
    </>
  );
}

interface RProps {
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
  const rippleWidth = noteSize * 2 * (props.big ? 1.5 : 1);
  const rippleHeight = rippleWidth * 0.7;
  useEffect(() => {
    if (!animateDone.current) {
      [ref, ref2].forEach((r, i) => {
        r.current.animate(
          [
            { transform: "scale(0)", opacity: 0.5 },
            { transform: "scale(0.8)", opacity: 0.5, offset: 0.8 },
            { transform: `scale(1)`, opacity: 0 },
          ],
          {
            duration: 350 - 200 * i,
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
            "absolute origin-center opacity-0 " +
            (props.chain >= bonusMax
              ? "bg-amber-300 border-amber-400/70 dark:bg-yellow-500 dark:border-yellow-400/70 "
              : "bg-yellow-200 border-yellow-300/70 dark:bg-amber-600 dark:border-amber-500/70 ")
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
  particleNum: number;
  left: number;
  bottom: number;
  noteSize: number;
  big: boolean;
  chain: number;
  particleAssets: RefObject<string[]>;
}
function Particle(props: PProps) {
  const ref = useRef<HTMLImageElement>(null!);
  const refBig = useRef<HTMLImageElement | null>(null);
  const animateDone = useRef<boolean>(false);
  const bigAnimateDone = useRef<boolean>(false);
  const { noteSize, particleNum } = props;
  const maxSize = noteSize * 1.8;
  const bigSize = noteSize * 3;
  useEffect(() => {
    if (!animateDone.current) {
      const angle = Math.random() * 360;
      const angleVel = Math.random() * 120 - 60;
      ref.current.animate(
        [
          { transform: `scale(0.3) rotate(${angle}deg)`, opacity: 0 },
          {
            transform: `scale(0.8) rotate(${angle + angleVel * 0.8}deg)`,
            opacity: 0.8,
            offset: 0.8,
          },
          { transform: `scale(1) rotate(${angle + angleVel}deg)`, opacity: 0 },
        ],
        { duration: 500, fill: "forwards", easing: "ease-out" }
      );
      animateDone.current = true;
    }
    if (props.big && refBig.current && !bigAnimateDone.current) {
      const angleBig = Math.random() * 360;
      const angleVel = Math.random() * 120 - 60;
      refBig.current?.animate(
        [
          { transform: `scale(0.3) rotate(${angleBig}deg)`, opacity: 0 },
          {
            transform: `scale(0.8) rotate(${angleBig + angleVel * 0.8}deg)`,
            opacity: 0.6,
            offset: 0.8,
          },
          {
            transform: `scale(1) rotate(${angleBig + angleVel}deg)`,
            opacity: 0,
          },
        ],
        { duration: 500, fill: "forwards", easing: "ease-out" }
      );
      bigAnimateDone.current = true;
    }
  }, [props.big]);

  return (
    <div
      className="absolute -z-10 "
      style={{
        width: 1,
        height: 1,
        left: props.left,
        bottom: props.bottom,
      }}
    >
      <img
        decoding="async"
        src={props.particleAssets.current[particleNum]}
        ref={ref}
        className="absolute opacity-0"
        style={{
          left: -maxSize / 2,
          bottom: -maxSize / 2,
          width: maxSize,
          minWidth: maxSize, // なぜかこれがないとwidthが0になってしまう...
          height: maxSize,
          minHeight: maxSize,
        }}
      />
      {props.big && (
        <img
          decoding="async"
          src={props.particleAssets.current[particleNum - 2]}
          ref={refBig}
          className="absolute opacity-0"
          style={{
            left: -bigSize / 2,
            bottom: -bigSize / 2,
            width: bigSize,
            minWidth: bigSize,
            height: bigSize,
            minHeight: bigSize,
          }}
        />
      )}
    </div>
  );
}
