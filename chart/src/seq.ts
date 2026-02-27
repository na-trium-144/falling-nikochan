import * as v from "valibot";
import {
  getBarLength,
  Signature,
  SignatureBarSchema,
  toStepArray,
} from "./signature.js";
import { BPMChange, BPMChangeWithLua, updateBpmTimeSec } from "./bpm.js";
import {
  Step,
  stepAdd,
  stepCmp,
  StepSchema,
  stepSub,
  stepToFloat,
  stepZero,
} from "./step.js";
import { BPMChange1 } from "./legacy/chart1.js";
import { Signature5 } from "./legacy/chart5.js";
import { Chart6, Level6Play } from "./legacy/chart6.js";
import {
  Level15Play,
  YTBeginSchema15,
  YTEndSecSchema15,
} from "./legacy/chart15.js";
import { docRefs, Schema } from "./docSchema.js";
import { resolver } from "hono-openapi";

const PosSchema = () =>
  v.object({
    x: v.number(),
    y: v.number(),
  });

export const DisplayParamSchema = () =>
  v.object({
    timeSecBefore: v.pipe(
      v.number(),
      v.description("hitTimeSec - (the time to start to apply this param)")
    ),
    u0: v.number(),
    du: v.number(),
    ddu: v.number(),
  });
export type DisplayParam = v.InferOutput<ReturnType<typeof DisplayParamSchema>>;

export const NoteSeqSchema = () =>
  v.pipe(
    v.object({
      id: v.pipe(
        v.number(),
        v.description("unique number of note, always equals to index in array")
      ),
      big: v.pipe(v.boolean(), v.description("whether the note is big")),
      bigDone: v.pipe(
        v.boolean(),
        v.description("whether the note has been judged, false by default")
      ),
      hitTimeSec: v.pipe(
        v.number(),
        v.description("hit judgement time, ignoring offset")
      ),
      appearTimeSec: v.pipe(
        v.number(),
        v.description("when note starts appearing")
      ),
      targetX: v.pipe(
        v.number(),
        v.description(
          "left edge: 0.0 - right edge: 1.0  (1 / 10 of NoteCommand.x)"
        )
      ),
      vx: v.pipe(v.number(), v.description("1 / 4 of NoteCommand.vx")),
      vy: v.pipe(v.number(), v.description("1 / 4 of NoteCommand.vy")),
      ay: v.pipe(v.number(), v.description("always 1 / 4")),
      display: v.pipe(
        v.array(DisplayParamSchema()),
        v.description(
          "Parameter u for each time.\n" +
            "The note position between \n" +
            "  display[i].timeSecBefore < (hitTimeSec - current time) < display[i+1].timeSecBefore \n" +
            "is calculated as follows:\n" +
            "t = hitTimeSec - current time - display[i].timeSecBefore,\n" +
            "u = u0 + du * t + ddu * t^2 / 2,\n" +
            "x = targetX + vx * u,\n" +
            "y = vy * u - ay * u^2 / 2.\n" +
            "(Exceptionally, if hitTimeSec - current time < 0, use display[0] with t = hitTimeSec - current time - 0.)"
        )
      ),
      hitPos: v.pipe(
        v.optional(PosSchema()),
        v.description("position of the note when hit")
      ),
      done: v.pipe(
        v.number(),
        v.description("judgement result, 0:NotYet 1:Good 2:OK 3:bad 4:miss 5:")
      ),
      baseScore: v.optional(v.number()),
      chainBonus: v.optional(v.number()),
      bigBonus: v.optional(v.number()),
      chain: v.optional(v.number()),
    }),
    v.description("Note data used for judgement and display during play.")
  );
export type Note = v.InferOutput<ReturnType<typeof NoteSeqSchema>>;

export const BPMChangeSeqSchema = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      timeSec: v.pipe(
        v.number(),
        v.description(
          "the timestamp when the bpm change happens, ignoring offset"
        )
      ),
      bpm: v.number(),
    }),
    v.description("BPM change command data with timestamp.")
  );
export async function BPMChangeSeqDoc(): Promise<Schema> {
  const schema = (await resolver(BPMChangeSeqSchema()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
    },
  };
}
export const SpeedChangeSeqSchema = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      bpm: v.pipe(
        v.number(),
        v.description(
          "the timestamp when the speed change happens, ignoring offset"
        )
      ),
      interp: v.pipe(
        v.boolean(),
        v.description(
          "whether the speed change is gradual between the previous and this speed change command."
        )
      ),
      timeSec: v.pipe(v.number(), v.minValue(0)),
    }),
    v.description(
      "Speed change command with timestamp, where bpm is the speed multiplier."
    )
  );
export async function SpeedChangeSeqDoc(): Promise<Schema> {
  const schema = (await resolver(SpeedChangeSeqSchema()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
    },
  };
}

export const SignatureSeqSchema = () =>
  v.pipe(
    v.object({
      step: StepSchema(),
      offset: StepSchema(),
      bars: SignatureBarSchema(),
    }),
    v.description(
      "Time signature change command. " +
        "Only beats that can be expressed as the sum of 4th, 8th, and 16th notes are supported. " +
        "If offset is not zero, the count start from the middle of the time signature. " +
        "(step - offset is the time of the first beat of this signature) \n" +
        "This only affects the display of slime-chans at the bottom right of the screen during play, " +
        "and does not affect the timing of notes or other commands."
    )
  );
export async function SignatureSeqDoc(): Promise<Schema> {
  const schema = (await resolver(SignatureSeqSchema()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      step: docRefs("Step"),
      offset: docRefs("Step"),
      bars: docRefs("SignatureBar"),
    },
  };
}

export const ChartSeqDataSchema = () =>
  v.object({
    notes: v.array(NoteSeqSchema()),
    bpmChanges: v.array(BPMChangeSeqSchema()),
    speedChanges: v.array(SpeedChangeSeqSchema()),
    signature: v.array(SignatureSeqSchema()),
    offset: v.number(),
    ytBegin: YTBeginSchema15(),
    ytEndSec: YTEndSecSchema15(),
  });
export async function ChartSeqDataDoc(): Promise<Schema> {
  const schema = (await resolver(ChartSeqDataSchema()).toOpenAPISchema())
    .schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      notes: docRefs("NoteSeq"),
      bpmChanges: docRefs("BPMChangeSeq"),
      speedChanges: docRefs("SpeedChangeSeq"),
      signature: docRefs("SignatureSeq"),
      ytBegin: docRefs("YTBegin15"),
      ytEndSec: docRefs("YTEndSec15"),
    },
  };
}
export type ChartSeqData = v.InferOutput<ReturnType<typeof ChartSeqDataSchema>>;

/**
 * 画面上でその瞬間に表示する音符の管理
 * (画面の状態をstateにするため)
 * 時刻の情報を持たない
 *
 * ver14でvelを追加
 */
export interface DisplayNote {
  id: number;
  pos: Pos;
  vel: Pos;
  done: number;
  bigDone: boolean;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}

/**
 * Solves a*x^2 + b*x + c = 0
 * @returns An array of two roots [root1, root2], or null if there are no real roots.
 * root1 is from `+ sqrt`, root2 is from `- sqrt`.
 */
function solveQuadEquation(
  a: number,
  b: number,
  c: number
): { plus: number; minus: number } | null {
  if (a === 0) {
    if (b === 0) {
      return null;
    }
    const root = -c / b;
    return { plus: root, minus: root };
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null;
  }
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const root1 = (-b + sqrtDiscriminant) / (2 * a);
  const root2 = (-b - sqrtDiscriminant) / (2 * a);
  return { plus: Math.max(root1, root2), minus: Math.min(root1, root2) };
}

/**
 * chartを読み込む
 */
export function loadChart(
  level: Level15Play | Level6Play | Chart6,
  levelIndex?: number
): ChartSeqData {
  if ("levels" in level) {
    if (levelIndex && level.levels.at(levelIndex)) {
      level = {
        ...level.levels.at(levelIndex)!,
        ver: 6,
        offset: level.offset,
      } satisfies Level6Play;
    } else {
      return {
        notes: [],
        bpmChanges: [],
        speedChanges: [],
        signature: [],
        offset: 0,
        ytBegin: 0,
        ytEndSec: 0,
      };
    }
  }

  const { bpm: bpmChanges, speed: speedChanges } = updateBpmTimeSec(
    level.bpmChanges,
    level.speedChanges
  );

  const notes: Note[] = [];
  for (let id = 0; id < level.notes.length; id++) {
    const c = level.notes[id];

    // hitの時刻
    const hitTimeSec: number = getTimeSec(bpmChanges, c.step);

    const display: DisplayParam[] = [];
    let tBegin = hitTimeSec;
    // noteCommandの座標系 (-5<=x<=5) から
    //  displayの座標系に変換するのもここでやる
    const targetX = (c.hitX + 5) / 10;
    const targetY = 0;
    const vx = c.hitVX / 4;
    const vy = c.hitVY / 4;
    const ay = 1 / 4;
    let u = 0;
    // u(t) = ∫t→tBegin, dt * speed(t) / 120
    // x(t) = targetX + vx * u(t)
    // y(t) = targetY + vy * u(t) - (ay * u(t)^2) / 2

    let uRangeMin: number, uRangeMax: number;
    if ("fall" in c && c.fall) {
      // max: dy/du = 0 or y(u) = 1.5 or x(u) = 2 or x(u) = -0.5
      // min: y(u) = -0.5 or x(u) = 2 or x(u) = -0.5
      const uTop = vy / ay;
      let uMaxY: number | null, uMinY: number | null;
      const u_y15 = solveQuadEquation(ay / 2, -vy, 1.5 - targetY);
      const u_y05 = solveQuadEquation(ay / 2, -vy, -0.5 - targetY);
      if (vy > 0) {
        uMaxY = u_y15 ? u_y15.minus : uTop;
        uMinY = u_y05?.minus ?? -Infinity; // should not happen?
      } else {
        uMinY = u_y15?.plus ?? -Infinity;
        uMaxY = u_y05 ? u_y05.plus : uTop;
      }
      const uMaxX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      const uMinX = Math.min((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uRangeMax = Math.min(uMaxX, uMaxY);
      uRangeMin = Math.max(uMinX, uMinY);
    } else {
      // y(t) = -0.5 or x(t) = 2 or x(t) = -0.5
      const u_y05 = solveQuadEquation(ay / 2, -vy, -0.5 - targetY);
      const uMaxY = u_y05?.plus ?? Infinity; // should not happen?
      const uMinY = u_y05?.minus ?? -Infinity;
      const uMaxX = Math.max((2 - targetX) / vx, (-0.5 - targetX) / vx);
      const uMinX = Math.min((2 - targetX) / vx, (-0.5 - targetX) / vx);
      uRangeMax = Math.min(uMaxX, uMaxY);
      uRangeMin = Math.max(uMinX, uMinY);
    }

    let xLegacy = (c.hitX + 5) / 10;
    let yLegacy = 0;
    let vxLegacy = c.hitVX;
    let vyLegacy = c.hitVY;
    const ayLegacy = 1;

    let appearTimeSec: number | null = null;
    for (let ti = speedChanges.length - 1; ti >= 0; ti--) {
      const ts = speedChanges[ti];
      if (ts.timeSec >= hitTimeSec && ti >= 1) {
        continue;
      }
      const tEnd = ts.timeSec;
      // tEnd <= 時刻 <= tBegin の間、
      //  t = tBegin - 時刻  > 0
      //  u = u(tBegin) + du * t
      let du: number;
      let ddu: number;
      const tsNext = speedChanges.at(ti + 1);
      if (tsNext && "interp" in tsNext && tsNext.interp && tBegin !== tEnd) {
        let nextBpm = tsNext.bpm;
        if (tBegin < tsNext.timeSec) {
          nextBpm =
            ts.bpm +
            ((tsNext.bpm - ts.bpm) / (tsNext.timeSec - tEnd)) * (tBegin - tEnd);
        }
        du = nextBpm / 120;
        ddu = (ts.bpm - nextBpm) / 120 / (tBegin - tEnd);
      } else {
        du = ts.bpm / 120;
        ddu = 0;
      }
      display.push({
        timeSecBefore: hitTimeSec - tBegin,
        u0: u,
        du: du,
        ddu: ddu,
      });

      const uEnd =
        u +
        du * (tBegin - tEnd) +
        (ddu * (tBegin - tEnd) * (tBegin - tEnd)) / 2;

      if (level.ver === 6) {
        const vx_Legacy = (vxLegacy * ts.bpm) / 4 / 120;
        const vy_Legacy = (vyLegacy * ts.bpm) / 4 / 120;
        const ay_Legacy = (ayLegacy * ts.bpm * ts.bpm) / 4 / 120 / 120;
        // tを少しずつ変えながら、x,yが画面内に入っているかをチェック
        for (let t = 0; t < tBegin - tEnd; t += 0.01) {
          const xt = xLegacy + vx_Legacy * t;
          const yt = yLegacy + vy_Legacy * t - (ay_Legacy * t * t) / 2;
          if (xt >= -0.5 && xt < 1.5 && yt >= -0.5 && yt < 1.5) {
            appearTimeSec = tBegin - t;
          }
        }
        if (ti == 0) {
          // tを少しずつ変えながら、x,yが画面内に入っているかをチェック
          for (let t = 0; t < 999; t += 0.01) {
            const xt = xLegacy + vx_Legacy * t;
            const yt = yLegacy + vy_Legacy * t - (ay_Legacy * t * t) / 2;
            if (xt >= -0.5 && xt < 1.5 && yt >= -0.5 && yt < 1.5) {
              appearTimeSec = tBegin - t;
            } else {
              break;
            }
          }
        }
        const dt = tBegin - tEnd;
        xLegacy += vx_Legacy * dt;
        // y += ∫ (vy + ay * t) dt
        yLegacy += vy_Legacy * dt - (ay_Legacy * dt * dt) / 2;
        vyLegacy -= ((ayLegacy * ts.bpm) / 120) * dt;
      } else {
        if (ddu === 0) {
          if (
            (u <= uRangeMax && uRangeMax <= uEnd) ||
            (u <= uRangeMax && ti === 0 && du > 0)
          ) {
            const tAppear = (uRangeMax - u) / du;
            appearTimeSec = tBegin - tAppear;
          } else if (
            (u >= uRangeMin && uRangeMin >= uEnd) ||
            (u >= uRangeMin && ti === 0 && du < 0)
          ) {
            const tAppear = (uRangeMin - u) / du;
            appearTimeSec = tBegin - tAppear;
          }
        } else {
          // u + du * dt + ddu * dt * dt / 2 == uRangeMax となるdt
          const dt_uRangeMax = solveQuadEquation(ddu / 2, du, u - uRangeMax);
          if (dt_uRangeMax) {
            if (
              dt_uRangeMax.plus >= 0 &&
              (dt_uRangeMax.plus < tBegin - tEnd || ti === 0)
            ) {
              appearTimeSec = tBegin - dt_uRangeMax.plus;
            } else if (
              dt_uRangeMax.minus >= 0 &&
              (dt_uRangeMax.minus < tBegin - tEnd || ti === 0)
            ) {
              appearTimeSec = tBegin - dt_uRangeMax.minus;
            }
          }
          // u + du * dt + ddu * dt * dt / 2 == uRangeMin となるdt
          const dt_uRangeMin = solveQuadEquation(ddu / 2, du, u - uRangeMin);
          if (dt_uRangeMin) {
            if (
              dt_uRangeMin.plus >= 0 &&
              (dt_uRangeMin.plus < tBegin - tEnd || ti === 0)
            ) {
              appearTimeSec = tBegin - dt_uRangeMin.plus;
            } else if (
              dt_uRangeMin.minus >= 0 &&
              (dt_uRangeMin.minus < tBegin - tEnd || ti === 0)
            ) {
              appearTimeSec = tBegin - dt_uRangeMin.minus;
            }
          }
        }
      }
      u = uEnd;
      tBegin = tEnd;
    }
    // 判定時刻が速度変化中の場合に判定を過ぎた後の速度を安定化する
    display.unshift({
      timeSecBefore: 0,
      u0: display[0].u0,
      du: display[0].du,
      ddu: 0,
    });
    if (appearTimeSec === null) {
      // Speed=0から譜面が始まる場合
      appearTimeSec = -Infinity;
    }
    notes.push({
      id,
      big: c.big,
      hitTimeSec,
      appearTimeSec,
      done: 0,
      bigDone: false,
      display,
      targetX,
      vx,
      vy,
      ay,
    });
  }
  return {
    offset: level.offset,
    signature: level.signature,
    bpmChanges: bpmChanges.map((b) => ({
      // 余計なプロパティを削除
      step: b.step,
      timeSec: b.timeSec,
      bpm: b.bpm,
    })),
    speedChanges: speedChanges.map((s) => ({
      step: s.step,
      timeSec: s.timeSec,
      interp: "interp" in s ? s.interp : false,
      bpm: s.bpm,
    })),
    notes,
    ytBegin: "ytBegin" in level ? level.ytBegin : 0,
    ytEndSec:
      "ytEndSec" in level
        ? level.ytEndSec
        : level.notes.length >= 1
          ? getTimeSec(bpmChanges, level.notes[level.notes.length - 1].step) +
            level.offset
          : 0,
  };
}

export function displayNote(note: Note, timeSec: number): DisplayNote | null {
  if (timeSec - note.hitTimeSec > 1.0) {
    return null;
  } else if (note.done >= 1 && note.done <= 3) {
    return {
      id: note.id,
      pos: note.hitPos || { x: -1, y: -1 },
      vel: { x: 0, y: 0 },
      done: note.done,
      bigDone: note.bigDone,
      chain: note.chain,
      baseScore: note.baseScore,
      chainBonus: note.chainBonus,
      bigBonus: note.bigBonus,
    };
  } else if (timeSec < note.appearTimeSec) {
    return null;
  } else {
    let di = 0;
    for (; di + 1 < note.display.length; di++) {
      if (timeSec > note.hitTimeSec - note.display[di + 1].timeSecBefore) {
        break;
      }
    }
    const dispParam = note.display[di];
    const { u0, du, ddu } = dispParam;
    const t = note.hitTimeSec - dispParam.timeSecBefore - timeSec;
    const u = u0 + du * t + (ddu * t * t) / 2;
    const u_ = du + ddu * t;
    return {
      id: note.id,
      pos: {
        x: note.targetX + note.vx * u,
        y: note.vy * u - (note.ay * u * u) / 2,
      },
      vel: {
        x: note.vx * u_,
        y: note.vy * u_ - note.ay * u * u_,
      },
      done: note.done,
      bigDone: note.bigDone,
      chain: note.chain,
      baseScore: note.baseScore,
      chainBonus: note.chainBonus,
      bigBonus: note.bigBonus,
    };
  }
}

/**
 * 判定線の位置
 */
export const targetY = 0.2;
/**
 * big音符の大きさ
 */
export function bigScale(big: boolean) {
  return big ? 1.5 : 1;
}
/**
 * 画面上の位置
 * x: 0(画面左端)〜1(画面右端)
 * y: 0(判定ライン)〜1(画面上端)
 */
export interface Pos {
  x: number;
  y: number;
}

function defaultBpmChange(): BPMChangeWithLua {
  return { bpm: 120, step: stepZero(), luaLine: null };
}
/**
 * bpmとstep数→時刻(秒数)
 */
export function getTimeSec(bpmChanges: BPMChange1[], step: Step): number {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromStep(bpmChanges, step)] || defaultBpmChange();
  return (
    targetBpmChange.timeSec +
    (60 / targetBpmChange.bpm) *
      (stepToFloat(step) - stepToFloat(targetBpmChange.step))
  );
}
/**
 * bpmと時刻(秒数)→step
 */
export function getStep(
  bpmChanges: BPMChange1[],
  timeSec: number,
  denominator: number
): Step {
  const targetBpmChange =
    bpmChanges[findBpmIndexFromSec(bpmChanges, timeSec)] || defaultBpmChange();
  const stepFloat =
    stepToFloat(targetBpmChange.step) +
    (timeSec - targetBpmChange.timeSec) / (60 / targetBpmChange.bpm);
  const num = Math.round(stepFloat * denominator);
  return {
    fourth: Math.floor(num / denominator),
    numerator: num % denominator,
    denominator,
  };
}
/**
 * 時刻(step)→小節数+小節内の拍数
 */
export function getSignatureState(
  signature: Signature5[],
  step: Step
): SignatureState {
  const targetSignature = signature[findBpmIndexFromStep(signature, step)];
  let barBegin = stepSub(targetSignature.step, targetSignature.offset);
  const barSteps = toStepArray(targetSignature);
  const barLength = getBarLength(targetSignature);
  let barNum = targetSignature.barNum;
  let bi = 0;
  while (true) {
    const barEnd = stepAdd(barBegin, barLength[bi % barLength.length]);
    if (stepCmp(barEnd, step) > 0) {
      let barStepBegin = barBegin;
      for (let si = 0; si < barSteps[bi % barLength.length].length; si++) {
        const barStepEnd = stepAdd(
          barStepBegin,
          barSteps[bi % barLength.length][si]
        );
        if (stepCmp(barStepEnd, step) > 0) {
          return {
            barNum,
            bar: targetSignature.bars[bi % barLength.length],
            stepAligned: barStepBegin,
            offset: stepSub(step, barBegin),
            count: stepAdd(stepSub(step, barStepBegin), {
              fourth: si,
              numerator: 0,
              denominator: 1,
            }),
          };
        }
        barStepBegin = barStepEnd;
      }
      throw new Error("should not reach here");
    }
    barNum += 1;
    barBegin = barEnd;
    bi += 1;
  }
}

export interface SignatureState {
  barNum: number;
  bar: (4 | 8 | 16)[];
  stepAligned: Step; // このカウントの開始にあわせた時刻
  offset: Step; // barの最初からの時刻
  count: Step; // これは時刻表現ではなく表示用、count.fourthはbar内のカウントに対応するので時間が飛ぶこともある
}

/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromSec(
  bpmChanges: BPMChange1[],
  timeSec: number
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex = bpmChanges.findIndex((ch) => timeSec < ch.timeSec) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
/**
 * 時刻(秒数)→bpm
 */
export function findBpmIndexFromStep(
  bpmChanges: BPMChange[] | BPMChange1[] | Signature[] | Signature5[],
  step: Step
): number {
  if (bpmChanges.length === 0) {
    return 0;
  }
  const targetBpmIndex =
    bpmChanges.findIndex((ch) => stepCmp(step, ch.step) < 0) - 1;
  if (targetBpmIndex === -2) {
    return bpmChanges.length - 1;
  }
  if (targetBpmIndex === -1) {
    return 0;
  }
  return targetBpmIndex;
}
