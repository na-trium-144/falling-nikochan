"use client";

import { useEffect, useRef, useState } from "react";
import { targetY, bigScale, bonusMax } from "@falling-nikochan/chart";
import { useResizeDetector } from "react-resize-detector";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import { displayNote6, DisplayNote6, Note6 } from "@falling-nikochan/chart";
import { displayNote7, DisplayNote7, Note7 } from "@falling-nikochan/chart";
import {
  Application,
  Assets,
  IRenderLayer,
  RenderLayer,
  Sprite,
  Texture,
} from "pixi.js";

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
  // canvasサイズはここ以外にも legacy/seq.ts のloadChart()でも制限される
  const canvasWidth: number | undefined = boxSize && boxSize * 2.5;
  const canvasHeight: number | undefined = boxSize && boxSize * 2;
  const canvasLeft: number | undefined =
    marginX !== undefined && boxSize ? marginX - boxSize * 0.5 : undefined;
  const canvasTop: number | undefined =
    marginY !== undefined && boxSize ? marginY - boxSize * 0.5 : undefined;
  const originX: number | undefined = boxSize && boxSize * 0.5;
  const originY: number | undefined = boxSize && boxSize * 1.5;

  const { rem } = useDisplayMode();
  const noteSize = Math.max(1.5 * rem, 0.06 * (boxSize || 0));

  const [app, setApp] = useState<Application | null>(null);
  const rippleLayer = useRef<IRenderLayer>(null);
  const particleLayer = useRef<IRenderLayer>(null);
  const nikochanLayer = useRef<IRenderLayer>(null);
  const [cleanupNotDone, setCleanupNotDone] = useState<boolean>(false);
  useEffect(() => {
    if (cleanupNotDone) return;
    const app = new Application();
    const pInit = app.init({ backgroundAlpha: 0 }).then(() => {
      ref.current?.appendChild(app.canvas);
      rippleLayer.current = new RenderLayer();
      app.stage.addChild(rippleLayer.current);
      particleLayer.current = new RenderLayer();
      app.stage.addChild(particleLayer.current);
      nikochanLayer.current = new RenderLayer();
      app.stage.addChild(nikochanLayer.current);
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
  }, [ref, cleanupNotDone]);
  useEffect(() => {
    if (app && canvasWidth && canvasHeight) {
      app.renderer.resize(canvasWidth, canvasHeight);
      app.canvas.style.marginLeft = `${canvasLeft}px`;
      app.canvas.style.marginTop = `${canvasTop}px`;
    }
  }, [app, ref, canvasWidth, canvasHeight, canvasLeft, canvasTop]);

  const nikochanAssets = useRef<Texture[]>([]);
  const particleAssets = useRef<(Texture | undefined)[]>([]);
  const rippleAsset = useRef<Texture | undefined>(undefined);
  useEffect(() => {
    Promise.all(
      [0, 1, 2, 3].map((name) =>
        Assets.load<Texture>(
          process.env.ASSET_PREFIX + `/assets/nikochan${name}.svg`,
        ),
      ),
    ).then((a) => {
      nikochanAssets.current = a;
    });
    Promise.all(
      Array.from(new Array(13)).map((_, i) =>
        [4, 6, 8, 10, 12].includes(i)
          ? Assets.load<Texture>(
              process.env.ASSET_PREFIX + `/assets/particle${i}.svg`,
            )
          : undefined,
      ),
    ).then((a) => {
      particleAssets.current = a;
    });
    Assets.load<Texture>(process.env.ASSET_PREFIX + `/assets/ripple.svg`).then(
      (a) => {
        rippleAsset.current = a;
      },
    );
  }, []);

  const nikochan = useRef<NikochanState[]>([]);
  useEffect(() => {
    const update = () => {
      const now = getCurrentTimeSec();
      const cx: NContext = {
        app: app!,
        boxSize: boxSize || 0,
        originX: originX || 0,
        originY: originY || 0,
        noteSize,
        targetY,
        nikochanAssets: nikochanAssets.current,
        particleAssets: particleAssets.current,
        rippleAsset: rippleAsset.current,
        nikochanLayer: nikochanLayer.current!,
        rippleLayer: rippleLayer.current!,
        particleLayer: particleLayer.current!,
      };
      if (
        playing &&
        originX !== undefined &&
        originY !== undefined &&
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
            const ns = nikochan.current[i]!;
            const n = notes[i];
            updateNikochan(ns, n, dn, cx);
          });
      } else {
        nikochan.current.forEach((ns) => {
          clearNikochan(ns, cx);
        });
        nikochan.current = [];
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
    originX,
    originY,
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
          className="-z-10"
          barFlash={props.barFlash}
          left={0}
          right="-100%"
          bottom={targetY * boxSize + marginY}
        />
      )}
    </div>
  );
}

interface NikochanState {
  sprite?: Sprite;
  rippleSprite?: Sprite[];
  particleSprite?: Sprite[];
  transitionBegin?: DOMHighResTimeStamp;
  pAngle?: number[];
  pAngleVel?: number[];
}
interface NContext {
  app: Application;
  boxSize: number;
  originX: number;
  originY: number;
  noteSize: number;
  targetY: number;
  nikochanAssets: Texture[];
  particleAssets: (Texture | undefined)[];
  rippleAsset: Texture | undefined;
  nikochanLayer: IRenderLayer;
  rippleLayer: IRenderLayer;
  particleLayer: IRenderLayer;
}
function clearNikochan(ns: NikochanState, cx: NContext) {
  if (ns.sprite) {
    cx.nikochanLayer.detach(ns.sprite);
    cx.app.stage.removeChild(ns.sprite);
    ns.sprite.destroy();
    ns.sprite = undefined;
  }
  if (ns.rippleSprite) {
    ns.rippleSprite.forEach((s) => {
      cx.rippleLayer.detach(s);
      cx.app.stage.removeChild(s);
      s.destroy();
    });
    ns.rippleSprite = undefined;
  }
  if (ns.particleSprite) {
    ns.particleSprite.forEach((s) => {
      cx.particleLayer.detach(s);
      cx.app.stage.removeChild(s);
      s.destroy();
    });
    ns.particleSprite = undefined;
  }
}
function updateNikochan(
  ns: NikochanState,
  n: Note6 | Note7,
  dn: DisplayNote6 | DisplayNote7 | null,
  cx: NContext,
) {
  if (!dn) {
    clearNikochan(ns, cx);
  } else {
    let s: Sprite;
    if (ns.sprite) {
      s = ns.sprite;
    } else {
      s = new Sprite();
      ns.sprite = s;
      cx.app.stage.addChild(s);
      cx.nikochanLayer.attach(s);
    }
    if (dn.done > 0 && !ns.transitionBegin) {
      ns.transitionBegin = performance.now();
    }
    nikochanSprite(ns, n, dn, s, cx);

    if ([1].includes(dn.done)) {
      let rs: Sprite[];
      if (ns.rippleSprite) {
        rs = ns.rippleSprite;
      } else {
        rs = [new Sprite(cx.rippleAsset), new Sprite(cx.rippleAsset)];
        ns.rippleSprite = rs;
        cx.app.stage.addChild(...rs);
        cx.rippleLayer.attach(...rs);
      }
      rippleSprite(ns, n, dn, rs, cx);
    }
    if (dn.chain && [1, 2].includes(dn.done)) {
      let ps: Sprite[];
      if (ns.particleSprite) {
        ps = ns.particleSprite;
      } else {
        // 6,8,10,12
        const particleNum =
          6 + Math.floor(3 * Math.min(1, dn.chain / bonusMax)) * 2;
        ps = [
          new Sprite(cx.particleAssets[particleNum]),
          new Sprite(cx.particleAssets[particleNum - 2]),
        ];
        ns.particleSprite = ps;
        cx.app.stage.addChild(...ps);
        cx.particleLayer.attach(...ps);
      }
      if (!ns.pAngle) {
        ns.pAngle = [Math.random() * 360, Math.random() * 360];
        ns.pAngleVel = [Math.random() * 120 - 60, Math.random() * 120 - 60];
      }
      particleSprite(ns, n, dn, ps, cx);
    }
  }
}
function nikochanSprite(
  ns: NikochanState,
  n: Note6 | Note7,
  dn: DisplayNote6 | DisplayNote7,
  s: Sprite,
  cx: NContext,
) {
  let scale: number = 1;
  let opacity: number = 1;
  let translateY: number = 0;
  const tAnim = Math.min(
    1,
    (performance.now() - (ns.transitionBegin || 0)) / 300,
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
  s.texture = cx.nikochanAssets[[0, 1, 2, 3, 0][dn.done]];
  s.anchor.set(0.5);
  s.width = cx.noteSize * bigScale(n.big) * scale;
  s.height = cx.noteSize * bigScale(n.big) * scale;
  s.x = dn.pos.x * cx.boxSize + cx.originX;
  s.y =
    -dn.pos.y * cx.boxSize -
    targetY * cx.boxSize +
    cx.originY -
    translateY * cx.noteSize;
  s.alpha = opacity;
}
function rippleSprite(
  ns: NikochanState,
  n: Note6 | Note7,
  dn: DisplayNote6 | DisplayNote7,
  rs: Sprite[],
  cx: NContext,
) {
  for (let i = 0; i < 2; i++) {
    const tAnim = Math.min(
      1,
      Math.max(0, performance.now() - (ns.transitionBegin || 0) - 200 * i) /
        (350 - 200 * i),
    );
    const opacity = tAnim < 0.8 ? 0.3 : 0.3 - ((tAnim - 0.8) / 0.2) * 0.3;
    const scale = 1 * tAnim;
    rs[i].width = cx.noteSize * 2 * (n.big ? 1.5 : 1) * scale;
    rs[i].height = rs[i].width * 0.7;
    rs[i].anchor.set(0.5);
    rs[i].x = n.targetX * cx.boxSize + cx.originX;
    rs[i].y = -targetY * cx.boxSize + cx.originY;
    rs[i].alpha = opacity;
  }
}
function particleSprite(
  ns: NikochanState,
  n: Note6 | Note7,
  dn: DisplayNote6 | DisplayNote7,
  ps: Sprite[],
  cx: NContext,
) {
  for (let i = 0; i < 2; i++) {
    const tAnim = Math.min(
      1,
      (performance.now() - (ns.transitionBegin || 0)) / 500,
    );
    const scale = tAnim < 0.8 ? 0.3 + (tAnim / 0.8) * 0.5 : tAnim;
    const opacity =
      (tAnim < 0.8 ? tAnim / 0.8 : 1 - (tAnim - 0.8) / 0.2) * [0.8, 0.6][i];
    const angle = ns.pAngle![i] + ns.pAngleVel![i] * tAnim;
    const pSize = cx.noteSize * [1.8, 3][i];
    ps[i].width = pSize * scale;
    ps[i].height = pSize * scale;
    ps[i].anchor.set(0.5);
    ps[i].x = n.targetX * cx.boxSize + cx.originX;
    ps[i].y = -targetY * cx.boxSize + cx.originY;
    ps[i].alpha = opacity;
    ps[i].angle = angle;
    if (!dn.bigBonus && i === 1) {
      ps[i].alpha = 0;
      ps[i].width = 0;
      ps[i].height = 0;
    }
  }
}
