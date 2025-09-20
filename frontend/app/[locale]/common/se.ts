import { useCallback, useEffect, useRef, useState } from "react";

export type SEType = "hit" | "hitBig" | "beat" | "beat1";

export function useSE(
  cid: string | undefined,
  userOffset: number,
  enableSE2: boolean,
  lsKeys: {
    hitVolume: string;
    hitVolumeCid?: string;
    beatVolume?: string;
    beatVolumeCid?: string;
    enableHitSE: string;
    enableBeatSE?: string;
  }
) {
  const audioContext = useRef<AudioContext | null>(null);
  const audioHit = useRef<AudioBuffer | null>(null);
  const audioHitBig = useRef<AudioBuffer | null>(null);
  const audioBeat = useRef<AudioBuffer | null>(null);
  const audioBeat1 = useRef<AudioBuffer | null>(null);
  const gainNodeHit = useRef<GainNode | null>(null);
  const gainNodeBeat = useRef<GainNode | null>(null);
  const lastPlayed = useRef<{ [key in SEType]?: DOMHighResTimeStamp }>({});
  const [hitVolume, setHitVolume_] = useState<number>(100);
  const setHitVolume = useCallback(
    (v: number) => {
      setHitVolume_(v);
      localStorage.setItem(lsKeys.hitVolume, v.toString());
      if (lsKeys.hitVolumeCid) {
        localStorage.setItem(lsKeys.hitVolumeCid, v.toString());
      }
      if (gainNodeHit.current) {
        gainNodeHit.current.gain.value = v / 100;
      }
    },
    [lsKeys.hitVolume, lsKeys.hitVolumeCid]
  );
  const [beatVolume, setBeatVolume_] = useState<number>(30);
  const setBeatVolume = useCallback(
    (v: number) => {
      setBeatVolume_(v);
      if (lsKeys.beatVolume) {
        localStorage.setItem(lsKeys.beatVolume, v.toString());
      }
      if (lsKeys.beatVolumeCid) {
        localStorage.setItem(lsKeys.beatVolumeCid, v.toString());
      }
      if (gainNodeBeat.current) {
        gainNodeBeat.current.gain.value = v / 100;
      }
    },
    [lsKeys.beatVolume, lsKeys.beatVolumeCid]
  );
  // undefined=未取得 null=取得不能
  const [audioLatency, setAudioLatency] = useState<number | null | undefined>(
    undefined
  );
  const [enableHitSE, setEnableHitSE_] = useState<boolean>(true);
  const [enableBeatSE, setEnableBeatSE_] = useState<boolean>(true);
  // playでのオフセット調整に使い、playではbeatは使わないので無視している
  const offsetPlusLatency = userOffset - (enableHitSE ? audioLatency || 0 : 0);
  const setEnableHitSE = useCallback(
    (v: boolean) => {
      const enableSE = v && "AudioContext" in window;
      setEnableHitSE_(enableSE);
      localStorage.setItem(lsKeys.enableHitSE, enableSE ? "1" : "0");
    },
    [lsKeys.enableHitSE]
  );
  const setEnableBeatSE = useCallback(
    (v: boolean) => {
      const enableSE = v && "AudioContext" in window;
      setEnableBeatSE_(enableSE);
      if (lsKeys.enableBeatSE) {
        localStorage.setItem(lsKeys.enableBeatSE, enableSE ? "1" : "0");
      }
    },
    [lsKeys.enableBeatSE]
  );
  useEffect(() => {
    if ((enableHitSE || enableBeatSE) && enableSE2) {
      audioContext.current?.resume();
    } else {
      audioContext.current?.suspend();
    }
  }, [enableHitSE, enableBeatSE, enableSE2]);
  useEffect(() => {
    if ("AudioContext" in window) {
      audioContext.current = new AudioContext();
      const enableSEInitial =
        localStorage.getItem(lsKeys.enableHitSE) === "1" ||
        (localStorage.getItem(lsKeys.enableHitSE) == null &&
          audioContext.current?.baseLatency !== undefined &&
          audioContext.current?.outputLatency !== undefined);
      if (enableSEInitial) {
        setEnableHitSE_(true);
      } else {
        setEnableHitSE_(false);
      }
      const enableBeatSEInitial =
        lsKeys.enableBeatSE &&
        (localStorage.getItem(lsKeys.enableBeatSE) === "1" ||
          (localStorage.getItem(lsKeys.enableBeatSE) == null &&
            audioContext.current?.baseLatency !== undefined &&
            audioContext.current?.outputLatency !== undefined));
      if (enableBeatSEInitial) {
        setEnableBeatSE_(true);
      } else {
        setEnableBeatSE_(false);
      }
      if (!enableSEInitial && !enableBeatSEInitial) {
        audioContext.current?.suspend();
      }
      gainNodeHit.current = audioContext.current.createGain();
      gainNodeBeat.current = audioContext.current.createGain();
      const vol = Number(
        localStorage.getItem(lsKeys.hitVolume) ||
          (lsKeys.hitVolumeCid && localStorage.getItem(lsKeys.hitVolumeCid)) ||
          100
      );
      setHitVolume_(vol);
      gainNodeHit.current.gain.value = vol / 100;
      gainNodeHit.current.connect(audioContext.current.destination);
      const vol2 = Number(
        (lsKeys.beatVolume && localStorage.getItem(lsKeys.beatVolume)) ||
          (lsKeys.beatVolumeCid &&
            localStorage.getItem(lsKeys.beatVolumeCid)) ||
          30
      );
      setBeatVolume_(vol2);
      gainNodeBeat.current.gain.value = vol2 / 100;
      gainNodeBeat.current.connect(audioContext.current.destination);
      (
        [
          ["hit", audioHit],
          ["hitBig", audioHitBig],
          ["beat", audioBeat],
          ["beat1", audioBeat1],
        ] as const
      ).forEach(([name, audioBuffer]) =>
        fetch(process.env.ASSET_PREFIX + `/assets/${name}.wav`)
          .then((res) => res.arrayBuffer())
          .then((aryBuf) => audioContext.current!.decodeAudioData(aryBuf))
          .then((audio) => {
            audioBuffer.current = audio;
          })
      );
      return () => {
        gainNodeHit.current?.disconnect();
        gainNodeHit.current = null;
        gainNodeBeat.current?.disconnect();
        gainNodeBeat.current = null;
        audioContext.current?.close();
        audioContext.current = null;
      };
    } else {
      setEnableHitSE_(false);
      setEnableBeatSE_(false);
    }
  }, [
    lsKeys.enableHitSE,
    lsKeys.enableBeatSE,
    lsKeys.hitVolume,
    lsKeys.hitVolumeCid,
    lsKeys.beatVolume,
    lsKeys.beatVolumeCid,
  ]);
  useEffect(() => {
    // AudioContext初期化直後はLatencyとして0が返ってくるが、
    // なぜか少し待ってから? or 実際にSEを再生してから? 取得すると違う値になる
    // なぜかlatencyがNaNになる環境もある
    const t = setTimeout(() => {
      const latency =
        audioContext.current?.baseLatency !== undefined &&
        audioContext.current?.outputLatency !== undefined
          ? audioContext.current.baseLatency +
            audioContext.current.outputLatency
          : null;
      if (audioLatency !== latency) {
        setAudioLatency(latency);
      }
    }, 100);
    return () => clearTimeout(t);
  });
  const playSE = useCallback(
    (s: SEType) => {
      let audioBuffer: AudioBuffer | null;
      let enableThisSE: boolean;
      let gainNode: GainNode | null;
      switch (s) {
        case "hit":
          audioBuffer = audioHit.current;
          enableThisSE = enableHitSE;
          gainNode = gainNodeHit.current;
          break;
        case "hitBig":
          audioBuffer = audioHitBig.current;
          enableThisSE = enableHitSE;
          gainNode = gainNodeHit.current;
          break;
        case "beat":
          audioBuffer = audioBeat.current;
          enableThisSE = enableBeatSE;
          gainNode = gainNodeBeat.current;
          break;
        case "beat1":
          audioBuffer = audioBeat1.current;
          enableThisSE = enableBeatSE;
          gainNode = gainNodeBeat.current;
          break;
        default:
          s satisfies never;
          return;
      }
      if (
        enableThisSE &&
        enableSE2 &&
        audioContext.current &&
        gainNode &&
        audioBuffer &&
        // 同時押しオートで音量が大きくなりすぎるのを防ぐ
        // しかし2個や3個同時押しと1個が全く同じ音になるので、違和感あるかも
        (!lastPlayed.current[s] ||
          performance.now() - lastPlayed.current[s] > 10)
      ) {
        lastPlayed.current[s] = performance.now();
        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode);
        source.start();
        source.addEventListener("ended", () => source.disconnect());
      }
    },
    [enableHitSE, enableBeatSE, enableSE2]
  );

  return {
    playSE,
    enableHitSE,
    setEnableHitSE,
    enableBeatSE,
    setEnableBeatSE,
    hitVolume,
    setHitVolume,
    beatVolume,
    setBeatVolume,
    audioLatency,
    offsetPlusLatency,
  };
}
