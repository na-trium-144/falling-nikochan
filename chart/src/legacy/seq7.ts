import { Pos } from "../seq.js";

/**
 * Note properties used in-game | ゲーム中で使用する音符の管理
 * --------------------------------------------------------
 * id: unique number | 通し番号
 * big: whether the note is big | 大音符
 * bigDone: whether the note has been judged | 判定済みかどうか
 * hitTimeSec: hit judgement time | 判定時刻
 * appearTimeSec: when note starts appearing | 画面に表示し始める時刻
 * targetX: 0.0 - 1.0  (1 / 10 of NoteCommand.x)
 * vx: 1 / 4 of NoteCommand.vx
 * vy: 1 / 4 of NoteCommand.vy
 * ay: ??
 * display: used for calculation of position | 画面上の位置の計算に使う
 * hitPos: position of the note when hit | 判定時の位置
 * done: judgement result | 判定結果
 *   0:NotYet 1:Good 2:OK 3:bad 4:miss
 */
export interface Note7 {
  ver: 7;
  id: number;
  big: boolean;
  bigDone: boolean;
  hitTimeSec: number;
  appearTimeSec: number;
  targetX: number;
  vx: number;
  vy: number;
  ay: number;
  display: DisplayParam7[];
  hitPos?: Pos;
  done: number;
  baseScore?: number;
  chainBonus?: number;
  bigBonus?: number;
  chain?: number;
}
export interface DisplayParam7 {
  // 時刻(判定時刻 - 秒数)
  timeSecBefore: number;
  // u = u0 + du t
  u0: number;
  du: number;
}

/**
 * 画面上でその瞬間に表示する音符の管理
 * (画面の状態をstateにするため)
 * 時刻の情報を持たない
 * 
 * ver14でvelを追加
 */
export interface DisplayNote7 {
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

export function displayNote7(
  note: Note7,
  timeSec: number
): DisplayNote7 | null {
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
    const { u0, du } = dispParam;
    const t = note.hitTimeSec - dispParam.timeSecBefore - timeSec;
    const u = u0 + du * t;
    return {
      id: note.id,
      pos: {
        x: note.targetX + note.vx * u,
        y: note.vy * u - (note.ay * u * u) / 2,
      },
      vel: {
        x: note.vx * du,
        y: note.vy * du - note.ay * u * du,
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
