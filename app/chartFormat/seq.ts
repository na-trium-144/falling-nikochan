import { NoteCommand, Chart, BPMChange } from "./command";

/**
 * 音符の大きさ (画面サイズに対する割合)
 */
export const noteSize = 0.05;
/**
 * 判定線の位置
 */
export const targetY = 0.1;
/**
 * 画面上の位置
 * x: 0(画面左端)〜1(画面右端)
 * y: 0(判定ライン)〜1(画面上端)
 */
export interface Pos {
  x: number;
  y: number;
}
/**
 * ゲーム中で使用する音符の管理
 * id: 通し番号
 * hitTimeSec: 判定時刻
 * display: 現在時刻→画面上の位置
 */
export interface Note {
  id: number;
  hitTimeSec: number;
  display: (
    timeSec: number,
    xRange: [number, number],
    yRange: [number, number]
  ) => DisplayNote | null;
}
/**
 * 画面上でその瞬間に表示する音符の管理
 * 時刻の情報を持たない
 */
export interface DisplayNote {
  id: number;
  pos: Pos;
}

/**
 * bpmとstep数→時刻(秒数)
 */
export function getTimeSec(bpmChanges: BPMChange[], step: number): number {
  let timeSec = 0;
  for (let bi = 0; bi < bpmChanges.length; bi++) {
    if (bi + 1 < bpmChanges.length && bpmChanges[bi + 1].step <= step) {
      timeSec +=
        (60 / bpmChanges[bi].bpm) *
        (bpmChanges[bi + 1].step - bpmChanges[bi].step);
    } else {
      timeSec += (60 / bpmChanges[bi].bpm) * (step - bpmChanges[bi].step);
      break;
    }
  }
  return timeSec;
}
/**
 * chartを読み込む
 */
export function loadChart(chart: Chart): Note[] {
  return chart.notes.map((c: NoteCommand, id) => {
    // step→時刻
    const hitTimeSec: number = getTimeSec(chart.bpmChanges, c.step);
    // timeScaleの変化点それぞれの時刻
    const tsTimeSec: number[] = c.timeScale.map((ts) =>
      getTimeSec(chart.bpmChanges, c.step - ts.stepBefore)
    );
    return {
      id,
      hitTimeSec,
      display: (
        timeSec: number,
        xRange: [number, number],
        yRange: [number, number]
      ): DisplayNote | null => {
        let x = c.hitX;
        let y = 0;
        let vx = c.hitVX;
        let vy = c.hitVY;
        // todo: これを毎フレーム計算しなくて済むようにする
        for (let ti = 0; ti < c.timeScale.length; ti++) {
          if (ti + 1 < c.timeScale.length && tsTimeSec[ti + 1] > timeSec) {
            const dt = c.timeScale[ti].scale * (hitTimeSec - tsTimeSec[ti + 1]);
            x += vx * dt;
            // y += ∫ (vy + ay * t) dt
            y += vy * dt - (c.accelY * dt * dt) / 2;
            vy -= c.accelY * dt;
          } else {
            const dt = c.timeScale[ti].scale * (hitTimeSec - timeSec);
            x += vx * dt;
            y += vy * dt - (c.accelY * dt * dt) / 2;
            break;
          }
        }
        if (
          x + noteSize >= xRange[0] &&
          x - noteSize < xRange[1] &&
          y + noteSize + targetY >= yRange[0] &&
          y - noteSize + targetY < yRange[1]
        ) {
          return { id, pos: { x, y } };
        } else {
          return null;
        }
      },
    };
  });
}
