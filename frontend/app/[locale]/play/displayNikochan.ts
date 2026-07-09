import {
  bigScale,
  bonusMax,
  displayNote,
  DisplayNote,
  NoteInGame,
  Pos,
  targetY,
} from "@falling-nikochan/chart";

const tailScaleFactor = 0.25;
const tailTau = 0.2;
const tailLambda = 0.15;

function norm(xy: Pos) {
  return Math.sqrt(xy.x * xy.x + xy.y * xy.y);
}

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 2);
}

function normalRandom(mean: number, std: number) {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // 0を避ける
  while (v === 0) v = Math.random();

  // ボックス＝ミュラー法による標準正規分布
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  return z * std + mean;
}
function logNormalRandom(mean: number, std: number) {
  const sigma2 = Math.log1p((std * std) / (mean * mean));
  const sigma = Math.sqrt(sigma2);
  const mu = Math.log(mean) - sigma2 / 2.0;
  return Math.exp(normalRandom(mu, sigma));
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
  effectsCanvasDPR: number;
  nikochanCanvasDPR: number;
  nikochanBitmap: ImageBitmap[][];
  lastNow: number;
  dark: boolean;
}
interface ParticleParams {
  deltaAngle: number;
  // big: number;
  size: number;
  hue: number;
  distance: number;
}
export class DisplayNikochan {
  #n: NoteInGame;
  #dn: DisplayNote;
  #c: Context;
  #now: DOMHighResTimeStamp;
  #fadeinStart: DOMHighResTimeStamp;
  #fadeoutStart: DOMHighResTimeStamp | null;
  #tailVel: Pos;
  #particleStartAngle: number | null = null;
  #particleParams: ParticleParams[] = [];

  constructor(n: NoteInGame, dn: DisplayNote, c: Context) {
    this.#n = n;
    this.#dn = dn;
    this.#c = c;
    this.#now = performance.now();

    // 出現直後は100msのフェードインをする。
    // ただし最初から画面外にいるものについてはフェードインしない(開始時刻を-Infinityにすることで完了状態にする)
    if (this.isOffScrean) {
      this.#fadeinStart = -Infinity;
    } else {
      this.#fadeinStart = this.#now;
    }
    this.#fadeoutStart = null;
    this.#tailVel = { x: 0, y: 0 };
  }
  update(dn: DisplayNote, c: Context) {
    this.#dn = dn;
    this.#c = c;
    this.#now = performance.now();
    if (this.#n.done !== 0) {
      if (this.#fadeoutStart === null) {
        this.#fadeoutStart = this.#now;
      }
    }
  }

  drawNikochan(nctx: CanvasRenderingContext2D) {
    let dx = 0;
    let dy = 0;
    let scale = 1;
    if (this.#n.done !== 0) {
      if (this.fadeoutFactor >= 1) {
        return;
      }
      if (this.#n.done === 1) {
        dy = -1 * this.#c.rem * this.fadeoutFactor;
        scale = 1 + 0.25 * this.fadeoutFactor;
      }
      if (this.#n.done === 2) {
        dy = -0.5 * this.#c.rem * this.fadeoutFactor;
      }
    }
    nctx.globalAlpha = 0.7 * this.globalAlpha;
    dx -= (this.size * (scale - 1)) / 2;
    dy -= (this.size * (scale - 1)) / 2;
    nctx.drawImage(
      this.#c.nikochanBitmap[this.#n.done <= 3 ? this.#n.done : 0][
        this.#n.big ? 1 : 0
      ],
      (this.left - this.size / 2 + dx) * this.#c.nikochanCanvasDPR,
      (this.top - this.size / 2 + dy) * this.#c.nikochanCanvasDPR,
      this.size * this.#c.nikochanCanvasDPR * scale,
      this.size * this.#c.nikochanCanvasDPR * scale
    );
  }

  drawTail(ctx: CanvasRenderingContext2D) {
    const headSize = this.#c.noteSize * 1;
    const tailSize = this.#c.noteSize * 0.85;
    if (this.#n.done !== 0) {
      if (this.fadeoutFactor >= 1) {
        return;
      }
    }

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
      const newVel = displayNote(this.#n, t)?.vel;
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
      ctx.translate(this.left, this.top);

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
      ctx.globalAlpha = tailOpacity * this.globalAlpha;
      ctx.fill();
      ctx.restore();
    }

    if (
      this.#n.done === 0 ||
      (tailLength > this.#c.noteSize / 2 && tailOpacity > 0.5)
    ) {
      ctx.save();
      ctx.scale(this.#c.tailsCanvasDPR, this.#c.tailsCanvasDPR);
      ctx.translate(this.left, this.top);

      ctx.globalAlpha =
        (this.#n.done === 0 ? 1 : tailOpacity) * this.globalAlpha;
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

  drawRipple(ctx: CanvasRenderingContext2D) {
    if (this.#n.done !== 1) {
      return;
    }

    for (const i of [0, 1]) {
      const duration = 350 - 200 * i;
      const delay = 200 * i;
      const t = (this.#now - delay - this.#fadeoutStart!) / duration;
      let scale = 0;
      let opacity = 0;

      if (t <= 0 || t >= 1) {
        continue;
      } else if (easeOut(t) <= 0.8) {
        const localT = easeOut(t) / 0.8;
        scale = localT * 0.8;
        opacity = 0.5;
      } else {
        const localT = (easeOut(t) - 0.8) / 0.2;
        scale = 0.8 + localT * 0.2;
        opacity = 0.5 * (1 - localT);
      }

      ctx.save();
      ctx.scale(this.#c.effectsCanvasDPR, this.#c.effectsCanvasDPR);
      ctx.translate(this.left, this.top);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;

      // 色の設定
      if ((this.#dn.chain ?? 0) >= bonusMax) {
        if (this.#c.dark) {
          ctx.fillStyle = "oklch(79.5% 0.184 86.047)"; // yellow-500
          ctx.strokeStyle = "oklch(85.2% 0.199 91.936 / .7)"; // yellow-400/70
        } else {
          ctx.fillStyle = "oklch(87.9% 0.169 91.605)"; // amber-300
          ctx.strokeStyle = "oklch(82.8% 0.189 84.429 / .7)"; // amber-400/70
        }
      } else {
        if (this.#c.dark) {
          ctx.fillStyle = "oklch(66.6% 0.179 58.318)"; // amber-600
          ctx.strokeStyle = "oklch(76.9% 0.188 70.08 / .7)"; // amber-500/70
        } else {
          ctx.fillStyle = "oklch(94.5% 0.129 101.54)"; // yellow-200
          ctx.strokeStyle = "oklch(90.5% 0.182 98.111 / .7)"; // yellow-300/70
        }
      }

      const width = this.#c.noteSize * 2.5 * (this.#dn.bigDone ? 1.5 : 1);
      const height = width * 0.7;

      ctx.lineWidth = width / 20;

      // 楕円を描画
      ctx.beginPath();
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  drawParticle(ctx: CanvasRenderingContext2D) {
    if (this.#dn.chain === undefined) {
      return;
    }
    if (this.#particleStartAngle === null) {
      this.#particleStartAngle = Math.random() * 360;
    }

    // -ver9.3: round(((1+(2*chain)/bonusMax)/3)*15) => 5-15, no big
    // ver9.4-16.22: 6+floor(3*min(1,chain/bonusMax))*2 => 6-12, big: (6+4)-(12+10)
    const smallParticleNum =
      6 + Math.floor(4 * Math.min(1, this.#dn.chain / bonusMax));
    const bigParticleNum = smallParticleNum - 2;

    for (const big of this.#dn.bigDone ? [0, 1] : [0]) {
      // bigの場合はparticleの輪を二重に表示する

      const particleNum = big ? bigParticleNum : smallParticleNum;

      for (let i = 0; i < particleNum; i++) {
        const pi = big ? smallParticleNum + i : i;
        if (!this.#particleParams.at(pi)) {
          this.#particleParams[pi] = {
            /*
            -ver9.3のコード
            distance: 0.5 + Math.random() * Math.random() * 1, // * noteSize
            deltaAngle: Math.random() * Math.random() * 120,
            big: Math.random() * 1 + 1,
            size: Math.random() * Math.random() * 0.5 + 0.5, // * noteSize / 4
            hue: Math.random() * Math.random() * 1,

            ver9.4-16.22は通常サイズがnoteSize*2, bigがnoteSize*3.5
            */
            distance: big ? logNormalRandom(2, 0.3) : logNormalRandom(1, 0.2), // * noteSize
            deltaAngle: normalRandom(0, 360 / particleNum / 4),
            size: big ? logNormalRandom(1.5, 0.3) : logNormalRandom(1, 0.2), // * noteSize / 4
            hue: Math.random(),
          };
        }
        const pp = this.#particleParams[pi];

        // -ver9.3: 55->40 (dark: 85-hue => 30->45)
        // ver9.4-16.22: 外側#ffcd00(hue48)-内側#ffb800(hue43)
        const hueMax = 50;
        const hueMin = 47 - (7 * Math.min(this.#dn.chain, bonusMax)) / bonusMax;
        let hue = hueMax * pp.hue + hueMin * (1 - pp.hue);
        if (this.#c.dark) {
          hue = 87 - hue;
        }
        const particleSize = (this.#c.noteSize / 4) * pp.size;

        const t = (this.#now - this.#fadeoutStart!) / 500;
        let opacity = 0;
        const dx = pp.distance * this.#c.noteSize * t;

        if (t <= 0 || t >= 1) {
          continue;
        } else if (easeOut(t) <= 0.8) {
          // const localT = easeOut(t) / 0.8;
          opacity = 0.8;
        } else {
          const localT = (easeOut(t) - 0.8) / 0.2;
          opacity = 0.8 * (1 - localT);
        }

        ctx.save();
        ctx.scale(this.#c.effectsCanvasDPR, this.#c.effectsCanvasDPR);
        ctx.translate(this.left, this.top);
        ctx.rotate(
          ((this.#particleStartAngle +
            (i * 360) / particleNum +
            pp.deltaAngle) *
            Math.PI) /
            180
        );
        ctx.translate(dx, 0);
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(0, 0, particleSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue} 100% 50%)`;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  get fadeinFactor() {
    return Math.min(1, (this.#now - this.#fadeinStart) / 100);
  }
  get fadeoutFactor() {
    return Math.min(1, (this.#now - this.#fadeoutStart!) / 300);
  }
  get globalAlpha() {
    if (this.#n.done === 0) {
      return this.fadeinFactor;
    } else {
      return 1 - this.fadeoutFactor;
    }
  }

  get id() {
    return this.#n.id;
  }
  get size() {
    return this.#c.noteSize * bigScale(this.#n.big);
  }
  get left() {
    return this.#dn.pos.x * this.#c.boxSize + this.#c.canvasMarginX;
  }
  get top() {
    return (
      this.#c.canvasMarginY +
      this.#c.boxSize -
      targetY * this.#c.boxSize -
      this.#dn.pos.y * this.#c.boxSize
    );
  }
  get isOffScrean() {
    return (
      this.left + this.size / 2 < 0 ||
      this.left - this.size / 2 > window.innerWidth ||
      this.top - this.size / 2 > this.#c.canvasMarginY + this.#c.boxSize ||
      this.top + this.size / 2 < 0
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
          this.left - this.size / 2 < 8 * this.#c.rem * this.#c.playUIScale)) &&
      this.#n.hitTimeSec - this.#c.now < 0.5 * this.#c.playbackRate &&
      this.#c.now - this.#n.hitTimeSec < 0.5 * this.#c.playbackRate
    );
  }
}
