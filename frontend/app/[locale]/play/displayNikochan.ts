import {
  bigScale,
  displayNote13,
  displayNote6,
  DisplayNote6,
  DisplayNote7,
  Note13,
  Note6,
  Pos,
  targetY,
} from "@falling-nikochan/chart";

const tailScaleFactor = 0.25;
const tailTau = 0.2;
const tailLambda = 0.15;

function norm(xy: Pos) {
  return Math.sqrt(xy.x * xy.x + xy.y * xy.y);
}

interface Context {
  noteSize: number;
  boxSize: number;
  playUIScale: number;
  canvasMarginX: number;
  canvasMarginY: number;
  marginY: number;
  playbackRate: number;
  rem: number;
  now: number;
  tailsCanvasDPR: number;
  nikochanCanvasDPR: number;
  nikochanBitmap: ImageBitmap[][];
  lastNow: number;
}
export class DisplayNikochan {
  #n: Note6 | Note13;
  #dn: DisplayNote6 | DisplayNote7;
  #c: Context;
  #fadeinStart: DOMHighResTimeStamp;
  #fadeoutStart: DOMHighResTimeStamp | null;
  #tailVel: Pos;

  constructor(n: Note6 | Note13, dn: DisplayNote6 | DisplayNote7, c: Context) {
    this.#n = n;
    this.#dn = dn;
    this.#c = c;

    // 出現直後は100msのフェードインをする。
    // ただし最初から画面外にいるものについてはフェードインしない(開始時刻を-Infinityにすることで完了状態にする)
    if (this.isOffScrean) {
      this.#fadeinStart = -Infinity;
    } else {
      this.#fadeinStart = performance.now();
    }
    this.#fadeoutStart = null;
    this.#tailVel = { x: 0, y: 0 };
  }
  update(dn: DisplayNote6 | DisplayNote7, c: Context) {
    this.#dn = dn;
    this.#c = c;
  }

  drawNikochan(nctx: CanvasRenderingContext2D) {
    let dx = 0;
    let dy = 0;
    let scale = 1;
    if (this.#n.done === 0) {
      const fadeinFactor = Math.min(
        1,
        (performance.now() - this.#fadeinStart) / 100
      );
      nctx.globalAlpha = 0.7 * fadeinFactor;
    } else {
      if (this.#fadeoutStart === null) {
        this.#fadeoutStart = performance.now();
      }
      const fadeoutFactor = (performance.now() - this.#fadeoutStart) / 300;
      if (fadeoutFactor >= 1) {
        return;
      }
      nctx.globalAlpha = 0.7 * (1 - fadeoutFactor);
      if (this.#n.done === 1) {
        dy = -1 * this.#c.rem * fadeoutFactor;
        scale = 1 + 0.25 * fadeoutFactor;
      }
      if (this.#n.done === 2) {
        dy = -0.5 * this.#c.rem * fadeoutFactor;
      }
    }
    dx -= (this.size * (scale - 1)) / 2;
    dy -= (this.size * (scale - 1)) / 2;
    nctx.drawImage(
      this.#c.nikochanBitmap[this.#n.done <= 3 ? this.#n.done : 0][
        this.#n.big ? 1 : 0
      ],
      (this.left + dx) * this.#c.nikochanCanvasDPR,
      (this.top + dy) * this.#c.nikochanCanvasDPR,
      this.size * this.#c.nikochanCanvasDPR * scale,
      this.size * this.#c.nikochanCanvasDPR * scale
    );
  }

  drawTail(ctx: CanvasRenderingContext2D) {
    const headSize = this.#c.noteSize * 1;
    const tailSize = this.#c.noteSize * 0.85;

    // 速度の変化が大きい場合に、細かく刻んで計算する
    const dtSplitNum = Math.max(
      1,
      Math.min(10, Math.round(Math.abs(this.#tailVel.y - this.#dn.vel.y) / 0.5))
    );
    const dt = Math.max(0, this.#c.now - this.#c.lastNow) / dtSplitNum;
    const updateVelDamp = (newVel: Pos) => {
      // dv(移動距離)は速度が反転する瞬間などは0(追従を遅くする)になってほしいので、
      // x,yそれぞれ平均してから絶対値を取る
      const dv =
        norm({
          x: (this.#tailVel.x + newVel.x) / 2,
          y: (this.#tailVel.y + newVel.y) / 2,
        }) * dt;
      const velDamp = Math.exp(-dt / tailTau - dv / tailLambda);
      this.#tailVel.x = this.#tailVel.x * velDamp + newVel.x * (1 - velDamp);
      this.#tailVel.y = this.#tailVel.y * velDamp + newVel.y * (1 - velDamp);
    };

    for (let di = 1; di < dtSplitNum; di++) {
      const t = this.#c.lastNow + dt * di;
      const newVel = (
        this.#n.ver === 6 ? displayNote6(this.#n, t) : displayNote13(this.#n, t)
      )?.vel;
      if (newVel) {
        updateVelDamp(newVel);
      }
    }
    updateVelDamp(this.#dn.vel);

    const log1pVelLength = Math.log1p(norm(this.#tailVel));
    const tailLength =
      log1pVelLength *
      tailScaleFactor *
      this.#c.boxSize *
      Math.sqrt(bigScale(this.#n.big));
    const tailWidth = tailSize * bigScale(this.#n.big);
    const tailOpacity = Math.min(1, log1pVelLength * 2);
    const velAngle = Math.atan2(-this.#tailVel.y, this.#tailVel.x);

    if (tailLength > this.#c.noteSize / 2 && tailOpacity > 0.5) {
      ctx.save();
      ctx.scale(this.#c.tailsCanvasDPR, this.#c.tailsCanvasDPR);
      ctx.translate(
        this.#dn.pos.x * this.#c.boxSize + this.#c.canvasMarginX,
        this.#c.canvasMarginY +
          this.#c.boxSize -
          targetY * this.#c.boxSize -
          this.#dn.pos.y * this.#c.boxSize
      );
      ctx.rotate(velAngle);
      const tailGrad = ctx.createLinearGradient(tailLength, 0, 0, 0);
      tailGrad.addColorStop(0, "#facd0000");
      tailGrad.addColorStop(1, "#facd00cc");
      ctx.beginPath();
      ctx.moveTo(tailLength, 0);
      ctx.lineTo(0, -tailWidth / 2);
      ctx.lineTo(0, tailWidth / 2);
      ctx.closePath();
      ctx.fillStyle = tailGrad;
      // ctx.shadowBlur = 10;
      // ctx.shadowColor = "#facd0080";
      ctx.globalAlpha = tailOpacity;
      ctx.fill();
      ctx.restore();
    }

    if (
      this.#n.done === 0 ||
      (tailLength > this.#c.noteSize / 2 && tailOpacity > 0.5)
    ) {
      ctx.save();
      ctx.scale(this.#c.tailsCanvasDPR, this.#c.tailsCanvasDPR);
      ctx.translate(
        this.#dn.pos.x * this.#c.boxSize + this.#c.canvasMarginX,
        this.#c.canvasMarginY +
          this.#c.boxSize -
          targetY * this.#c.boxSize -
          this.#dn.pos.y * this.#c.boxSize
      );
      ctx.globalAlpha = this.#n.done === 0 ? 1 : tailOpacity;
      ctx.beginPath();
      const headRadius = (headSize * bigScale(this.#n.big)) / 2;
      ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
      const headGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, headRadius);
      headGrad.addColorStop(0, "#ffe89dff");
      headGrad.addColorStop(0.5, "#ffe89dcc");
      headGrad.addColorStop(1, "#ffe89d00");
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.restore();
    }
  }

  get id() {
    return this.#n.id;
  }
  get size() {
    return this.#c.noteSize * bigScale(this.#n.big);
  }
  get left() {
    return (
      this.#dn.pos.x * this.#c.boxSize + this.#c.canvasMarginX - this.size / 2
    );
  }
  get top() {
    return (
      this.#c.canvasMarginY +
      this.#c.boxSize -
      targetY * this.#c.boxSize -
      this.#dn.pos.y * this.#c.boxSize -
      this.size / 2
    );
  }
  get isOffScrean() {
    return (
      this.left + this.size < 0 ||
      this.left - this.size > window.innerWidth ||
      this.top - this.size > this.#c.canvasMarginY + this.#c.boxSize ||
      this.top + this.size < 0
    );
  }
  get targetLeft() {
    return (
      this.#n.targetX * this.#c.boxSize + this.#c.canvasMarginX - this.size / 2
    );
  }
  get shouldHideBPMSign() {
    // 実際のBPMSignのサイズ + 0.5rem くらい
    return (
      this.#c.marginY + targetY * this.#c.boxSize - this.size / 2 <
        5 * this.#c.rem * this.#c.playUIScale &&
      (this.targetLeft < 8 * this.#c.rem * this.#c.playUIScale ||
        ("vy" in this.#n &&
          this.#n.vy <= 0 &&
          this.left < 8 * this.#c.rem * this.#c.playUIScale)) &&
      this.#n.hitTimeSec - this.#c.now < 0.5 * this.#c.playbackRate &&
      this.#c.now - this.#n.hitTimeSec < 0.5 * this.#c.playbackRate
    );
  }
}
