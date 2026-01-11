"use client";

import clsx from "clsx/lite";
import { memo, RefObject, useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote13, DisplayNote7, Note13 } from "@falling-nikochan/chart";
import { useDelayedDisplayState } from "@/common/delayedDisplayState";
import { useTheme } from "@/common/theme";

interface Props {
  className?: string;
  style?: object;
  notes: Note6[] | Note13[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setCbFPS: (fps: number) => void;
  setRunFPS: (fps: number) => void;
  setRenderFPS: (fps: number) => void;
  barFlash: FlashPos;
  noClear: boolean;
  playbackRate: number;
}
export type FlashPos = { targetX: number } | { clientX: number } | undefined;
export default function FallingWindow(props: Props) {
  const {
    notes,
    playing,
    getCurrentTimeSec,
    setCbFPS,
    setRenderFPS,
    setRunFPS,
    noClear,
    playbackRate,
  } = props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  const [rerenderIndex, setRerenderIndex] = useState<number>(0);
  // requestAnimationFrame() のコールバックの呼び出される間隔から測定する端末FPS
  const cbDeltas = useRef<DOMHighResTimeStamp[]>([]);
  const cbFps = useRef<number>(60);
  // レンダリング等nikochanの1フレームの処理にかかる時間の測定
  // triggered: requestAnimationFrame() でセット
  // executedIndex: render関数が実行されたらセット
  const runTriggeredTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const runTriggeredIndex = useRef<number>(0);
  const runExecutedIndex = useRef<number>(0);
  const runDeltas = useRef<DOMHighResTimeStamp[]>([]);
  const runFps = useRef<number>(60);
  // 最終的なFPS
  const renderFpsCounter = useRef<DOMHighResTimeStamp[]>([]);
  useEffect(() => {
    let animFrame: ReturnType<typeof requestAnimationFrame>;
    let prevTimeStamp = performance.now();
    let prevRerender = performance.now();
    const updateLoop = () => {
      animFrame = requestAnimationFrame(updateLoop);

      if (
        runExecutedIndex.current >= runTriggeredIndex.current &&
        runTriggeredTimeStamp.current !== null
      ) {
        runDeltas.current.push(
          performance.now() - runTriggeredTimeStamp.current
        );
        runTriggeredTimeStamp.current = null;
      }

      cbDeltas.current.push(performance.now() - prevTimeStamp);
      prevTimeStamp = performance.now();

      if (cbDeltas.current.length > Math.max(cbFps.current, 20)) {
        const sortedDeltas = [...cbDeltas.current].sort((a, b) => a - b);
        const medianDelta = sortedDeltas[Math.floor(sortedDeltas.length / 4)];
        cbFps.current = Math.round(1000 / medianDelta);
        setCbFPS(cbFps.current);
        cbDeltas.current = [];
      }

      if (runDeltas.current.length > Math.max(runFps.current, 20)) {
        const runDeltaSum = runDeltas.current.reduce((a, b) => a + b, 0);
        const avgRunDelta = runDeltaSum / runDeltas.current.length;
        runFps.current = Math.round(1000 / avgRunDelta);
        setRunFPS(runFps.current);
        runDeltas.current = [];
      }

      // フレームレートがrunFps程度になるように抑えつつ一定の間隔でrerenderを呼び出すようにする
      if (
        runTriggeredTimeStamp.current === null &&
        Math.round(
          (performance.now() - prevRerender) / (1000 / cbFps.current)
        ) >= Math.round(cbFps.current / Math.max(runFps.current, 20))
      ) {
        setRerenderIndex((r) => {
          runTriggeredIndex.current = r + 1;
          return r + 1;
        });
        runTriggeredTimeStamp.current = performance.now();
        if (
          Math.round(
            (performance.now() - prevRerender) / (1000 / cbFps.current)
          ) >=
          3 * Math.round(cbFps.current / Math.max(runFps.current, 20))
        ) {
          // 大幅に遅延している場合
          prevRerender = performance.now();
        } else {
          prevRerender +=
            (1000 / cbFps.current) *
            Math.round(cbFps.current / Math.max(runFps.current, 20));
        }
      }
    };
    animFrame = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrame);
  }, [setCbFPS, setRunFPS]);
  useEffect(() => {
    const i = setInterval(() => {
      while (
        renderFpsCounter.current.at(0) &&
        renderFpsCounter.current.at(-1)! - renderFpsCounter.current.at(0)! >
          1000
      ) {
        renderFpsCounter.current.shift();
      }
      setRenderFPS(renderFpsCounter.current.length);
    }, 100);
    return () => clearInterval(i);
  }, [setRenderFPS]);

  const displayNotes = useRef<DisplayNote6[] | DisplayNote7[]>([]);
  if (runExecutedIndex.current !== rerenderIndex) {
    performance.mark("nikochan-rerender");
    runExecutedIndex.current = rerenderIndex;
    renderFpsCounter.current.push(performance.now());
    const now = getCurrentTimeSec();
    if (
      playing &&
      marginX !== undefined &&
      marginY !== undefined &&
      boxSize &&
      now !== undefined
    ) {
      displayNotes.current = notes
        .map((n) =>
          n.ver === 6 ? displayNote6(n, now) : displayNote13(n, now)
        )
        .filter((n) => n !== null);
    } else {
      if (!noClear) {
        displayNotes.current = [];
      }
    }
  }

  const nikochanAssets = useRef<string[]>([]);
  const particleAssets = useRef<string[]>([]);
  const cometTailAsset = useRef<string>("");
  const cometHeadAsset = useRef<string>("");
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
    fetch(process.env.ASSET_PREFIX + `/assets/comet-tail.svg`)
      .then((res) => res.text())
      .then((text) => {
        cometTailAsset.current = `data:image/svg+xml;base64,${btoa(text)}`;
      });
    fetch(process.env.ASSET_PREFIX + `/assets/comet-head.svg`)
      .then((res) => res.text())
      .then((text) => {
        cometHeadAsset.current = `data:image/svg+xml;base64,${btoa(text)}`;
      });
  }, []);

  return (
    <div className={clsx(props.className)} style={props.style} ref={ref}>
      <div className="relative w-full h-full overflow-visible">
        {/* 判定線 */}
        {boxSize && marginY !== undefined && (
          <TargetLine
            barFlash={
              props.barFlash === undefined || marginX === undefined
                ? undefined
                : "targetX" in props.barFlash
                  ? props.barFlash.targetX * boxSize + marginX
                  : props.barFlash.clientX
            }
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
            playbackRate={playbackRate}
            nikochanAssets={nikochanAssets}
            particleAssets={particleAssets}
            cometTailAsset={cometTailAsset}
            cometHeadAsset={cometHeadAsset}
          />
        )}
      </div>
    </div>
  );
}

interface MProps {
  displayNotes: DisplayNote6[] | DisplayNote7[];
  notes: Note6[] | Note13[];
  noteSize: number;
  boxSize: number;
  marginX: number;
  marginY: number;
  playbackRate: number;
  nikochanAssets: RefObject<string[]>;
  particleAssets: RefObject<string[]>;
  cometTailAsset: RefObject<string>;
  cometHeadAsset: RefObject<string>;
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
      playbackRate={props.playbackRate}
      nikochanAssets={props.nikochanAssets}
      particleAssets={props.particleAssets}
      cometTailAsset={props.cometTailAsset}
      cometHeadAsset={props.cometHeadAsset}
    />
  ));
});

interface NProps {
  displayNote: DisplayNote6 | DisplayNote7;
  noteSize: number;
  note: Note6 | Note13;
  marginX: number;
  marginY: number;
  boxSize: number;
  playbackRate: number;
  nikochanAssets: RefObject<string[]>;
  particleAssets: RefObject<string[]>;
  cometTailAsset: RefObject<string>;
  cometHeadAsset: RefObject<string>;
}
function Nikochan(props: NProps) {
  /* にこちゃん
  d.done に応じて画像と動きを変える
  0: 通常
  1〜3: good, ok, bad
  4: miss は画像が0と同じ
  */
  const {
    displayNote,
    noteSize,
    marginX,
    marginY,
    boxSize,
    note,
    playbackRate,
  } = props;

  const x = displayNote.pos.x * boxSize + marginX;
  const y = displayNote.pos.y * boxSize + targetY * boxSize + marginY;
  const size = noteSize * bigScale(note.big);
  const headSize = noteSize * 1;
  const tailSize = noteSize * 0.85;
  const tailScaleFactor = 0.25;
  const velX = useRef<number>(0);
  const velY = useRef<number>(0);
  const lastT = useRef<DOMHighResTimeStamp>(performance.now());
  const dt = (performance.now() - lastT.current) / 1000;
  // TODO: 加速度? 速度? に応じて追従速度を変えた方が良くなる気がしなくもない
  const a = Math.exp((-dt * playbackRate) / 0.1);
  velX.current = velX.current * a + displayNote.vel.x * (1 - a);
  velY.current = velY.current * a + displayNote.vel.y * (1 - a);
  lastT.current = performance.now();
  const velLength = Math.sqrt(
    velX.current * velX.current + velY.current * velY.current
  );
  const velAngle = Math.atan2(-velY.current, velX.current);
  const isOffScreen =
    x + size / 2 < 0 ||
    x - size / 2 > window.innerWidth ||
    y - size / 2 > boxSize ||
    y + size / 2 < 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enableFadeIn, appeared, setEnableFadeIn] = useDelayedDisplayState(0, {
    delayed: !isOffScreen,
  });
  const { isDark } = useTheme();
  return (
    <>
      <div
        className={clsx(
          "absolute",
          displayNote.done === 0 &&
            (enableFadeIn
              ? appeared
                ? "transition ease-linear duration-100 opacity-100"
                : "opacity-0"
              : "opacity-100"),
          displayNote.done === 1 &&
            "transition ease-linear duration-300 -translate-y-4 opacity-0 scale-125",
          displayNote.done === 2 &&
            "transition ease-linear duration-300 -translate-y-2 opacity-0",
          displayNote.done === 3 &&
            "transition ease-linear duration-300 opacity-0",
          displayNote.done === 4 &&
            "transition ease-linear duration-200 opacity-0"
        )}
        style={{
          /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
          width: noteSize * bigScale(note.big),
          height: noteSize * bigScale(note.big),
          fontSize: noteSize * bigScale(note.big), // 1em で参照できるように
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
          className="absolute inset-0 w-full h-full opacity-70"
        />
        {/* chainBonusをにこちゃんの右上に表示する */}
        {/*{displayNote.baseScore !== undefined &&
          displayNote.chainBonus !== undefined &&
          displayNote.chain && (
            <span
              className={clsx(
               "absolute w-12 text-xs",
                (displayNote.chain >= 100 || displayNote.bigDone) && "text-orange-500"
              )}
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
        <img
          decoding="async"
          src={props.cometHeadAsset.current}
          className="block absolute -z-5"
          style={{
            width: headSize * bigScale(note.big),
            height: headSize * bigScale(note.big),
            left: (size - headSize * bigScale(note.big)) / 2,
            bottom: (size - headSize * bigScale(note.big)) / 2,
          }}
        />
      </div>
      <img
        className="block absolute -z-7 origin-left"
        style={{
          width: tailSize * Math.sqrt(bigScale(note.big)),
          height: tailSize * bigScale(note.big),
          left: displayNote.pos.x * boxSize + marginX,
          bottom:
            displayNote.pos.y * boxSize +
            targetY * boxSize -
            (tailSize * bigScale(note.big)) / 2 +
            marginY,
          transform:
            `rotate(${(velAngle * 180) / Math.PI}deg) ` +
            `scaleX(${Math.log1p(velLength) * tailScaleFactor * boxSize / tailSize})`,
          opacity:
            (isDark ? 0.4 : 0.6) * Math.min(1, Math.log1p(velLength / 0.5)),
        }}
        decoding="async"
        src={props.cometTailAsset.current}
      />
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
  const rippleWidth = noteSize * 2.5 * (props.big ? 1.5 : 1);
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
          className={clsx(
            "absolute origin-center opacity-0",
            props.chain >= bonusMax
              ? "bg-amber-300 border-amber-400/70 dark:bg-yellow-500 dark:border-yellow-400/70"
              : "bg-yellow-200 border-yellow-300/70 dark:bg-amber-600 dark:border-amber-500/70"
          )}
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
  const maxSize = noteSize * 2;
  const bigSize = noteSize * 3.5;
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
