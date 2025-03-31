import { useCallback, useEffect, useRef, useState } from "react";

export type SEType = "hit" | "hitBig";

export function useSE(cid: string | undefined, userOffset: number) {
  const audioContext = useRef<AudioContext | null>(null);
  const audioHit = useRef<AudioBuffer | null>(null);
  const audioHitBig = useRef<AudioBuffer | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const lastPlayed = useRef<{ [key in SEType]?: Date }>({});
  const [seVolume, setSEVolume_] = useState<number>(100);
  const setSEVolume = useCallback(
    (v: number) => {
      setSEVolume_(v);
      localStorage.setItem("seVolume", v.toString());
      if (cid) {
        localStorage.setItem(`seVolume-${cid}`, v.toString());
      }
      if (gainNode.current) {
        gainNode.current.gain.value = v / 100;
      }
    },
    [cid],
  );
  // undefined=未取得 null=取得不能
  const [audioLatency, setAudioLatency] = useState<number | null | undefined>(
    undefined,
  );
  const [enableSE, setEnableSE_] = useState<boolean>(true);
  const offsetPlusLatency = userOffset - (enableSE ? audioLatency || 0 : 0);
  const setEnableSE = useCallback(
    (v: boolean) => {
      setEnableSE_(v);
      localStorage.setItem("enableSE", v ? "1" : "0");
      if (!v) {
        audioContext.current?.suspend();
      } else {
        audioContext.current?.resume();
      }
    },
    [audioContext],
  );
  useEffect(() => {
    audioContext.current = new AudioContext();
    const enableSEInitial =
      localStorage.getItem("enableSE") === "1" ||
      (localStorage.getItem("enableSE") == null &&
        audioContext.current?.baseLatency !== undefined &&
        audioContext.current?.outputLatency !== undefined);
    if (enableSEInitial) {
      setEnableSE_(true);
    } else {
      setEnableSE_(false);
      audioContext.current?.suspend();
    }
    gainNode.current = audioContext.current.createGain();
    const vol = Number(
      localStorage.getItem(`seVolume-${cid}`) ||
        localStorage.getItem("seVolume") ||
        100,
    );
    setSEVolume_(vol);
    gainNode.current.gain.value = vol / 100;
    gainNode.current.connect(audioContext.current.destination);
    (
      [
        ["hit", audioHit],
        ["hitBig", audioHitBig],
      ] as const
    ).forEach(([name, audioBuffer]) =>
      fetch(process.env.ASSET_PREFIX + `/assets/${name}.wav`)
        .then((res) => res.arrayBuffer())
        .then((aryBuf) => audioContext.current!.decodeAudioData(aryBuf))
        .then((audio) => {
          audioBuffer.current = audio;
        }),
    );
    return () => {
      gainNode.current?.disconnect();
      gainNode.current = null;
      audioContext.current?.close();
      audioContext.current = null;
    };
  }, [cid]);
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
      switch (s) {
        case "hit":
          audioBuffer = audioHit.current;
          break;
        case "hitBig":
          audioBuffer = audioHitBig.current;
          break;
        default:
          return;
      }
      if (
        enableSE &&
        audioContext.current &&
        gainNode.current &&
        audioBuffer &&
        // 同時押しオートで音量が大きくなりすぎるのを防ぐ
        // しかし2個や3個同時押しと1個が全く同じ音になるので、違和感あるかも
        (!lastPlayed.current[s] ||
          Date.now() - lastPlayed.current[s].getTime() > 10)
      ) {
        lastPlayed.current[s] = new Date();
        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gainNode.current);
        source.start();
        source.addEventListener("ended", () => source.disconnect());
      }
    },
    [enableSE],
  );

  return {
    playSE,
    enableSE,
    setEnableSE,
    seVolume,
    setSEVolume,
    audioLatency,
    offsetPlusLatency,
  };
}
