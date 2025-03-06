"use client";

import { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
// import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";

interface Props {
  className?: string;
  style?: object;
  scale?: number;
  control: boolean;
  id?: string;
  ytPlayer: { current?: YouTubePlayer };
  onReady?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (ec: number) => void;
  onPlaybackRateChange?: (rate: number) => void;
  fixedSide: "width" | "height";
}
export function FlexYouTube(props: Props) {
  const {
    id,
    control,
    ytPlayer,
    onReady,
    onStart,
    onStop,
    onError,
    onPlaybackRateChange,
    fixedSide,
  } = props;
  const { width, height, ref } = useResizeDetector();
  const scale = props.scale || 1;
  const resizeYouTube = useRef<() => void>(undefined);
  const onReadyRef = useRef<() => void>(undefined);
  const onStartRef = useRef<() => void>(undefined);
  const onStopRef = useRef<() => void>(undefined);
  const onErrorRef = useRef<(ec: number) => void>(undefined);
  const onPlaybackRateChangeRef = useRef<(rate: number) => void>(undefined);
  useEffect(() => {
    resizeYouTube.current = () => {
      console.log("resize");
      if (ytPlayer.current) {
        if (width && height) {
          const iframe = ytPlayer.current.getIframe();
          if (fixedSide === "width") {
            iframe.width = String(width / scale);
            iframe.height = String((width * 9) / 16 / scale);
          } else {
            iframe.height = String(height / scale);
            iframe.width = String((height * 16) / 9 / scale);
          }
        }
      }
    };
    resizeYouTube.current();
  }, [width, height, ytPlayer, fixedSide, scale]);

  onReadyRef.current = onReady;
  onStartRef.current = onStart;
  onStopRef.current = onStop;
  onErrorRef.current = onError;
  onPlaybackRateChangeRef.current = onPlaybackRateChange;

  useEffect(() => {
    if (id) {
      const loadVideo = () => {
        // the Player object is created uniquely based on the id in props
        // https://developers.google.com/youtube/iframe_api_reference?hl=ja#Loading_a_Video_Player
        ytPlayer.current = new (window as any).YT.Player("youtube-player", {
          width: 1,
          height: 1,
          videoId: id,
          playerVars: {
            autoplay: 0,
            controls: control ? 1 : 0,
            disablekb: control ? 0 : 1,
            fs: 0,
          },
          events: {
            onReady: () => {
              if (resizeYouTube.current) {
                resizeYouTube.current();
              }
              if (onReadyRef.current) {
                onReadyRef.current();
              }
            },
            onStateChange: () => {
              console.log(ytPlayer.current?.getPlayerState());
              if (ytPlayer.current?.getPlayerState() === 1) {
                if (onStartRef.current) {
                  onStartRef.current();
                }
              } else {
                if (onStopRef.current) {
                  onStopRef.current();
                }
              }
            },
            onPlaybackRateChange: () => {
              if (onPlaybackRateChangeRef.current) {
                onPlaybackRateChangeRef.current(
                  ytPlayer.current?.getPlaybackRate() || 1
                );
              }
            },
            onError: (e: any) => {
              console.warn("youtube error:", e.data);
              if (onErrorRef.current) {
                onErrorRef.current(e.data);
              }
            },
          },
        }) as YouTubePlayer;
      };
      // https://stackoverflow.com/questions/54017100/how-to-integrate-youtube-iframe-api-in-reactjs-solution
      if (!(window as any).YT) {
        // If not, load the script asynchronously
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";

        // onYouTubeIframeAPIReady will load the video after the script is loaded
        (window as any).onYouTubeIframeAPIReady = loadVideo;

        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);
      } else {
        // If script is already there, load the video directly
        loadVideo();
      }
    }
  }, [id, control, ytPlayer]);
  return (
    <div
      className={
        "relative " + props.className
        /* + " flex justify-center items-center"*/
      }
      style={{
        ...props.style,
        width: fixedSide === "height" && height ? (height * 16) / 9 : undefined,
        height: fixedSide === "width" && width ? (width * 9) / 16 : undefined,
      }}
      ref={ref}
    >
      <div
        className="absolute right-0 top-0 origin-top-right "
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <div id="youtube-player" />
      </div>
    </div>
  );
}

/**
 * @see https://developers.google.com/youtube/iframe_api_reference
 */
export interface YouTubePlayer {
  addEventListener(event: string, listener: (event: CustomEvent) => void): void;
  destroy(): void;
  getAvailablePlaybackRates(): readonly number[];
  getAvailableQualityLevels(): readonly string[];
  getCurrentTime(): number;
  getDuration(): number;
  getIframe(): HTMLIFrameElement;
  getOption(module: string, option: string): any;
  getOptions(): string[];
  getOptions(module: string): object;
  setOption(module: string, option: string, value: any): void;
  setOptions(): void;
  cuePlaylist(
    playlist: string | readonly string[],
    index?: number,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cuePlaylist(playlist: {
    listType: string;
    list?: string | undefined;
    index?: number | undefined;
    startSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadPlaylist(
    playlist: string | readonly string[],
    index?: number,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  loadPlaylist(playlist: {
    listType: string;
    list?: string | undefined;
    index?: number | undefined;
    startSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  getPlaylist(): readonly string[];
  getPlaylistIndex(): number;
  getPlaybackQuality(): string;
  getPlaybackRate(): number;
  getPlayerState(): number;
  getVideoEmbedCode(): string;
  getVideoLoadedFraction(): number;
  getVideoUrl(): string;
  getVolume(): number;
  cueVideoById(
    videoId: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cueVideoById(video: {
    videoId: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  cueVideoByUrl(
    mediaContentUrl: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  cueVideoByUrl(video: {
    mediaContentUrl: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadVideoByUrl(
    mediaContentUrl: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  loadVideoByUrl(video: {
    mediaContentUrl: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  loadVideoById(
    videoId: string,
    startSeconds?: number,
    suggestedQuality?: string
  ): void;
  loadVideoById(video: {
    videoId: string;
    startSeconds?: number | undefined;
    endSeconds?: number | undefined;
    suggestedQuality?: string | undefined;
  }): void;
  isMuted(): boolean;
  mute(): void;
  nextVideo(): void;
  pauseVideo(): void;
  playVideo(): void;
  playVideoAt(index: number): void;
  previousVideo(): void;
  removeEventListener(
    event: string,
    listener: (event: CustomEvent) => void
  ): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setLoop(loopPlaylists: boolean): void;
  setPlaybackQuality(suggestedQuality: string): void;
  setPlaybackRate(suggestedRate: number): void;
  setShuffle(shufflePlaylist: boolean): void;
  // getSize(): PlayerSize;
  setSize(width: number, height: number): object;
  setVolume(volume: number): void;
  stopVideo(): void;
  unMute(): void;
  on(
    eventType: "stateChange",
    listener: (event: CustomEvent & { data: number }) => void
  ): void;
  // on(eventType: EventType, listener: (event: CustomEvent) => void): void;
}
