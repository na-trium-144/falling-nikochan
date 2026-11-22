import { YouTubePlayer } from "@/common/youtube";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useYouTubeSync(
  ytPlayer: RefObject<YouTubePlayer | undefined>,
  ytBegin: number,
  ytEndSec: number,
  offset: number,
  userOffsetPlusLatency: number,
  ytVolume: number,
  callbacks?: {
    // start() を呼び、実際にyoutubeの動画がスタートした時
    onStart?: () => void;
    // stop() を呼ぶか、youtubeの動画が停止した時
    onStop?: () => void;
    // finish() を呼ぶか、youtubeの動画が最後まで再生された時
    onFinish?: () => void;
    // いずれもsetPlayState()と同時にそれぞれ呼ぶ
  }
) {
  const cbOnStart = useRef<(() => void) | undefined>(undefined);
  const cbOnStop = useRef<(() => void) | undefined>(undefined);
  const cbOnFinish = useRef<(() => void) | undefined>(undefined);
  cbOnStart.current = callbacks?.onStart;
  cbOnStop.current = callbacks?.onStop;
  cbOnFinish.current = callbacks?.onFinish;

  const [playState, setPlayState] = useState<
    "playing" | "stopped" | "finished" | null
  >(null);
  const chartPlaying = playState === "playing";
  const showStopped = playState === "stopped";
  const showResult = playState === "finished";

  const [ytReady, setYtReady] = useState<boolean>(false);
  const [ytError, setYtError] = useState<number | null>(null);
  const [endSecPassed, setEndSecPassed] = useState<boolean>(false);

  const [userBegin, setUserBegin_] = useState<number | null>(null);
  const setUserBegin = useCallback(
    (v: number | null) => {
      setUserBegin_(v);
      if (ytPlayer.current?.getPlayerState?.() === 2) {
        ytPlayer.current.seekTo?.(v === null ? ytBegin : v, true);
      }
    },
    [ytBegin, ytPlayer]
  );
  const begin = userBegin === null ? ytBegin : userBegin;

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const changePlaybackRate = useCallback(
    (rate: number) => {
      ytPlayer.current?.setPlaybackRate?.(rate);
    },
    [ytPlayer]
  );

  // ytPlayerから現在時刻を取得
  // 動画基準なのでplaybackRateが1でない場合現実の秒単位とは異なる
  // offsetを引いた後の値
  const rawStartTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const filteredStartTimeStamp = useRef<DOMHighResTimeStamp | null>(null);
  const timeStampLastAdjusted = useRef<DOMHighResTimeStamp>(0);
  const perfStarted = useRef<DOMHighResTimeStamp | null>(null);
  const actualPlaybackRateRef = useRef<number>(playbackRate);
  const minActualPlaybackRateRef = useRef<number>(playbackRate);
  const [minActualPlaybackRate, setMinActualPlaybackRate] =
    useState<number>(playbackRate);
  const sampleTimestamps = useRef<{ perf: DOMHighResTimeStamp; yt: number }[]>(
    []
  );
  const getCurrentTimeSec = useCallback(() => {
    if (ytPlayer.current?.getCurrentTime && chartPlaying) {
      const ytCurrentTime = ytPlayer.current.getCurrentTime();
      const perfNow = performance.now();
      const ytNow =
        ytCurrentTime - offset - userOffsetPlusLatency * playbackRate;
      rawStartTimeStamp.current = perfNow - (ytNow * 1000) / playbackRate;
      if (filteredStartTimeStamp.current === null) {
        filteredStartTimeStamp.current = rawStartTimeStamp.current;
      }
      if (perfStarted.current === null) {
        perfStarted.current = perfNow;
        actualPlaybackRateRef.current = playbackRate;
      }

      const now =
        ((perfNow - filteredStartTimeStamp.current) / 1000) * playbackRate;
      const dt = (perfNow - timeStampLastAdjusted.current) / 1000;

      // 再生速度改ざん検知
      if (
        ytPlayer.current?.getPlayerState?.() === 1 &&
        sampleTimestamps.current.length > 2 &&
        perfNow - sampleTimestamps.current[0].perf > 1000
      ) {
        const actualPlaybackRate =
          ((ytCurrentTime - sampleTimestamps.current[0].yt) /
            (perfNow - sampleTimestamps.current[0].perf)) *
          1000;
        actualPlaybackRateRef.current =
          actualPlaybackRateRef.current * Math.exp(-dt / 5.0) +
          actualPlaybackRate * (1 - Math.exp(-dt / 5.0));
        const actualPlaybackRateRounded =
          Math.round(actualPlaybackRateRef.current * 20) / 20; // x0.05単位;
        if (
          perfNow - perfStarted.current > 5000 && // スマホなどで再生開始直後は不安定なため待つ
          actualPlaybackRateRounded < minActualPlaybackRateRef.current &&
          actualPlaybackRateRounded < playbackRate * 0.96 // 設定速度から-5%までの誤差は許容する
        ) {
          setMinActualPlaybackRate(
            (minActualPlaybackRateRef.current = actualPlaybackRateRounded)
          );
        }

        // 1000msのリングバッファ
        while (
          sampleTimestamps.current.length > 2 &&
          perfNow - sampleTimestamps.current[0].perf > 1000
        ) {
          sampleTimestamps.current.shift();
        }
      }
      sampleTimestamps.current.push({ perf: perfNow, yt: ytCurrentTime });

      // ずれを少しずつ補正する (ローパスフィルタ)
      filteredStartTimeStamp.current =
        filteredStartTimeStamp.current * Math.exp(-dt / 1.0) +
        rawStartTimeStamp.current * (1 - Math.exp(-dt / 1.0));
      timeStampLastAdjusted.current = perfNow;
      return now;
    }
  }, [chartPlaying, userOffsetPlusLatency, playbackRate, offset, ytPlayer]);

  const fadeoutTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const start = useCallback(() => {
    // Space(スタートボタン)が押されたとき
    fadeoutTimeouts.current.forEach((t) => clearTimeout(t));
    fadeoutTimeouts.current = [];
    ytPlayer.current?.setVolume?.(ytVolume);
    switch (ytPlayer.current?.getPlayerState?.()) {
      case 2:
      case 0:
        ytPlayer.current?.seekTo?.(begin, true);
        ytPlayer.current?.playVideo?.();
        break;
      case 5:
      default:
        ytPlayer.current?.seekTo?.(begin, true);
        break;
    }
  }, [begin, ytPlayer, ytVolume]);
  const fadeout = useCallback(() => {
    fadeoutTimeouts.current.forEach((t) => clearTimeout(t));
    fadeoutTimeouts.current = [];
    for (let i = 1; i <= 10; i++) {
      fadeoutTimeouts.current.push(
        setTimeout(() => {
          ytPlayer.current?.setVolume?.(((10 - i) * ytVolume) / 10);
        }, i * 100)
      );
      fadeoutTimeouts.current.push(
        setTimeout(() => {
          ytPlayer.current?.pauseVideo?.();
        }, 1000)
      );
    }
  }, [ytPlayer, ytVolume]);
  const stop = useCallback(() => {
    if (playState === "playing") {
      setPlayState("stopped");
      fadeout();
      cbOnStop.current?.();
    }
  }, [playState, fadeout]);
  const finish = useCallback(() => {
    if (playState === "playing") {
      setPlayState("finished");
      fadeout();
      cbOnFinish.current?.();
    }
  }, [playState, fadeout]);

  useEffect(() => {
    if (chartPlaying) {
      const checkEnd = () => {
        if ((ytPlayer.current?.getCurrentTime?.() ?? 0) >= ytEndSec) {
          setEndSecPassed(true);
        }
      };
      const t = setInterval(checkEnd, 100);
      return () => clearInterval(t);
    }
  }, [chartPlaying, getCurrentTimeSec, ytEndSec, ytPlayer]);

  const onReady = useCallback(() => {
    console.log("ready ->", ytPlayer.current?.getPlayerState?.());
    setYtReady(true);
  }, [ytPlayer]);
  const onStart = useCallback(() => {
    console.log("start ->", ytPlayer.current?.getPlayerState?.());
    setEndSecPassed(false);
    setPlayState("playing");
    fadeoutTimeouts.current.forEach((t) => clearTimeout(t));
    fadeoutTimeouts.current = [];
    ytPlayer.current?.setVolume?.(ytVolume);
    filteredStartTimeStamp.current = perfStarted.current = null;
    setMinActualPlaybackRate((minActualPlaybackRateRef.current = playbackRate));
    sampleTimestamps.current = [];
    cbOnStart.current?.();
  }, [ytVolume, playbackRate, ytPlayer]);
  const onStop = useCallback(() => {
    console.log("stop ->", ytPlayer.current?.getPlayerState?.());
    switch (ytPlayer.current?.getPlayerState?.()) {
      case 0:
        if (chartPlaying) {
          setPlayState("finished");
          cbOnFinish.current?.();
        }
        break;
      case 2:
        if (chartPlaying) {
          setPlayState("stopped");
          cbOnStop.current?.();
        }
        // ytPlayer.current?.seekTo(begin, true);
        break;
    }
    filteredStartTimeStamp.current = perfStarted.current = null;
    // setMinActualPlaybackRate(minActualPlaybackRateRef.current = playbackRate);
    sampleTimestamps.current = [];
  }, [chartPlaying, ytPlayer]);
  const onError = useCallback((ec: number) => {
    setYtError(ec);
  }, []);

  return {
    playState,
    chartPlaying,
    showStopped,
    showResult,
    userBegin,
    setUserBegin,
    playbackRate,
    setPlaybackRate,
    changePlaybackRate,
    minActualPlaybackRate,
    rawStartTimeStamp,
    filteredStartTimeStamp,
    getCurrentTimeSec,
    start,
    stop,
    finish,
    ytReady,
    ytError,
    endSecPassed,
    onStart,
    onStop,
    onReady,
    onError,
  };
}
