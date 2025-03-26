import { useCallback, useEffect, useRef, useState } from "react";

export type SEType = "hit" | "hitBig" | "chain";

export function useSE(userOffset: number) {
  const audioContext = useRef<AudioContext | null>(null);
  const audioHit = useRef<AudioBuffer | null>(null);
  const audioHitBig = useRef<AudioBuffer | null>(null);
  const audioChain = useRef<AudioBuffer | null>(null);
  // const gainNode = useRef<GainNode | null>(null);
  const [audioLatency, setAudioLatency] = useState<number>(0);
  const [enableSE, setEnableSE_] = useState<boolean>(true);
  const offsetPlusLatency = userOffset - (enableSE ? audioLatency : 0);
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
    const v = localStorage.getItem("enableSE");
    if (v === "0") {
      setEnableSE_(false);
      audioContext.current?.suspend();
    } else {
      setEnableSE_(true);
    }
    (
      [
        ["hit", audioHit],
        ["hitBig", audioHitBig],
        ["chain", audioChain],
      ] as const
    ).forEach(([name, audioBuffer]) =>
      fetch(process.env.ASSET_PREFIX + `/assets/${name}.wav`)
        .then((res) => res.arrayBuffer())
        .then((aryBuf) => audioContext.current!.decodeAudioData(aryBuf))
        .then((audio) => {
          audioBuffer.current = audio;
        }),
    );
    // gainNode.current = audioContext.current.createGain();
    // gainNode.current.gain.value = 1;
    // gainNode.current.connect(audioContext.current.destination);
    return () => {
      // gainNode.current?.disconnect();
      // gainNode.current = null;
      audioContext.current?.close();
      audioContext.current = null;
    };
  }, []);
  useEffect(() => {
    // AudioContext初期化直後はLatencyとして0が返ってくるが、
    // なぜか少し待ってから? or 実際にSEを再生してから? 取得すると違う値になる
    // なぜかlatencyがNaNになる環境もある
    const t = setTimeout(() => {
      if (audioContext.current) {
        setAudioLatency(
          (audioContext.current.baseLatency || 0) +
            (audioContext.current.outputLatency || 0),
        );
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
        case "chain":
          audioBuffer = audioChain.current;
          break;
        default:
          return;
      }
      if (enableSE && audioContext.current && audioBuffer) {
        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current.destination);
        source.start();
        source.addEventListener("ended", () => source.disconnect());
      }
    },
    [enableSE],
  );

  return { playSE, enableSE, setEnableSE, audioLatency, offsetPlusLatency };
}
