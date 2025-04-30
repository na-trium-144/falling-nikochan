"use client";

import { useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote7, DisplayNote7, Note7 } from "@falling-nikochan/chart";
import { Application, Assets, Sprite, Texture } from "pixi.js";

interface Props {
  className?: string;
  style?: object;
  notes: Note6[] | Note7[];
  getCurrentTimeSec: () => number | undefined;
  playing: boolean;
  setFPS?: (fps: number) => void;
  maxFPS: number;
  frameDrop: number | null;
  barFlash: boolean;
}

export default function FallingWindow(props: Props) {
  const { notes, playing, getCurrentTimeSec, setFPS, maxFPS, frameDrop } =
    props;
  const { width, height, ref } = useResizeDetector();
  const boxSize: number | undefined =
    width && height && Math.min(width, height);
  const marginX: number | undefined = width && boxSize && (width - boxSize) / 2;
  const marginY: number | undefined =
    height && boxSize && (height - boxSize) / 2;

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  const [app, setApp] = useState<Application | null>(null);
  const [cleanupNotDone, setCleanupNotDone] = useState<boolean>(false);
  useEffect(() => {
    if (cleanupNotDone) return;
    const app = new Application();
    const pInit = app
      .init({ backgroundAlpha: 0, width: boxSize, height: boxSize })
      .then(() => {
        ref.current?.appendChild(app.canvas);
        setApp(app);
      });
    return () => {
      setCleanupNotDone(true);
      pInit.then(() => {
        app.destroy(true, { children: true });
        setApp(null);
        setCleanupNotDone(false);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, cleanupNotDone]);
  useEffect(() => {
    if (boxSize && app) {
      app.renderer.resize(boxSize, boxSize);
    }
  }, [app, boxSize, ref]);

  const nikochanAssets = useRef<Texture[]>([]);
  const particleAssets = useRef<Texture[]>([]);
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map((name) =>
        Assets.load(process.env.ASSET_PREFIX + `/assets/nikochan${name}.svg`),
      ),
    ).then((a) => {
      nikochanAssets.current = a;
    });
    Promise.all(
      [4, 6, 8, 10, 12].map((name) =>
        Assets.load(process.env.ASSET_PREFIX + `/assets/particle${name}.svg`),
      ),
    ).then((a) => {
      particleAssets.current = a;
    });
  }, []);

  interface NikochanState {
    display?: DisplayNote6 | DisplayNote7;
    sprite?: Sprite;
    transitionBegin?: DOMHighResTimeStamp;
  }
  const nikochan = useRef<NikochanState[]>([]);
  useEffect(() => {
    const update = () => {
      const now = getCurrentTimeSec();
      if (
        app &&
        playing &&
        marginX !== undefined &&
        marginY !== undefined &&
        boxSize &&
        now !== undefined
      ) {
        // todo: mapではなくforループにして途中でbreak
        notes
          .map((n) =>
            n.ver === 6 ? displayNote6(n, now) : displayNote7(n, now),
          )
          .forEach((dn, i) => {
            if (i >= nikochan.current.length) {
              nikochan.current.push({});
            }
            const n = nikochan.current[i]!;
            n.display = dn || undefined;
            if (dn) {
              let s: Sprite;
              if (n.sprite) {
                s = n.sprite;
              } else {
                s = new Sprite(nikochanAssets.current[0]);
                n.sprite = s;
                app.stage.addChild(s);
              }
              if (dn.done > 0 && !n.transitionBegin) {
                n.transitionBegin = performance.now();
              }
              let scale: number = 1;
              let opacity: number = 1;
              let translateY: number = 0;
              const tAnim = Math.min(
                1,
                (performance.now() - (n.transitionBegin || 0)) / 300,
              );
              switch (dn.done) {
                case 0:
                  break;
                case 1:
                  scale = 1 + 0.4 * tAnim;
                  opacity = 1 - tAnim;
                  translateY = 1 * tAnim;
                  break;
                case 2:
                  opacity = 1 - tAnim;
                  translateY = 0.5 * tAnim;
                  break;
                case 3:
                  opacity = 1 - tAnim;
                  break;
              }
              s.texture = nikochanAssets.current[[0, 1, 2, 3, 0][dn.done]];
              s.anchor.set(0.5);
              s.width = noteSize * bigScale(notes[i].big) * scale;
              s.height = noteSize * bigScale(notes[i].big) * scale;
              s.x = dn.pos.x * boxSize + marginX;
              s.y =
                boxSize -
                (dn.pos.y * boxSize +
                  targetY * boxSize +
                  marginY +
                  translateY * noteSize);
              s.alpha = opacity;
            }
          });
      }
    };
    if (app) {
      app?.ticker?.add(update);
      return () => void app?.ticker?.remove(update);
    }
  }, [
    app,
    boxSize,
    notes,
    noteSize,
    marginX,
    marginY,
    rem,
    playing,
    getCurrentTimeSec,
  ]);

  const fpsCounter = useRef<DOMHighResTimeStamp[]>([]);
  useEffect(() => {
    const update = () => {
      performance.mark("nikochan-tick");
      const nowDate = performance.now();
      fpsCounter.current.push(nowDate);
      while (
        fpsCounter.current.at(0) &&
        fpsCounter.current.at(-1)! - fpsCounter.current.at(0)! > 1000
      ) {
        fpsCounter.current.shift();
      }
      setFPS?.(fpsCounter.current.length);
    };
    app?.ticker?.add(update);
    return () => void app?.ticker?.remove(update);
  }, [app, setFPS]);

  return (
    <div className={props.className} style={props.style} ref={ref}>
      {/* 判定線 */}
      {boxSize && marginY !== undefined && (
        <TargetLine
          barFlash={props.barFlash}
          left={0}
          right="-100%"
          bottom={targetY * boxSize + marginY}
        />
      )}
    </div>
  );
}

/*      {[1].includes(displayNote.done) && (
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
          big={displayNote.bigDone}
          chain={displayNote.chain || 0}
        />
      )}*/

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
          },
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
        { duration: 500, fill: "forwards", easing: "ease-out" },
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
        { duration: 500, fill: "forwards", easing: "ease-out" },
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
        src={process.env.ASSET_PREFIX + `/assets/particle${particleNum}.svg`}
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
          src={
            process.env.ASSET_PREFIX + `/assets/particle${particleNum - 2}.svg`
          }
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
