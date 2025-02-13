import { Chart, emptyChart } from "./chart.js";

export function getSample(cid: string): Chart {
  return {
    ...emptyChart("ja"),
    ...{
      602399: {
        ytId: "kcuF1gta0fQ",
        title: "Get Started!",
        composer: "na-trium-144",
      },
      983403: {
        ytId: "PEvhWGSZfVU",
        title: "The Fantasic Taste",
        composer: "na-trium-144",
      },
      596134: {
        ytId: "UnIhRpIT7nc",
        title: "ラグトレイン",
        composer: "稲葉曇 (feat. 歌愛ユキ)",
      },
      592994: {
        ytId: "9QLT1Aw_45s",
        title: "フォニイ",
        composer: "ツキミ (feat. 可不)",
      },
      488006: {
        ytId: "wDgQdr8ZkTw",
        title: "MEGALOVANIA",
        composer: "Toby Fox",
      },
      850858: {
        ytId: "FtutLA63Cp8",
        title: "Bad Apple!! feat. nomico",
        composer: "Masayoshi Minoshima",
      },
      768743: {
        ytId: "k-3y2LVF_SE",
        title: "FREEDOM DiVE↓",
        composer: "xi",
      },
    }[cid],
    chartCreator: "(dev dummy file)",
  };
}
