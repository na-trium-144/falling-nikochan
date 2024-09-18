"use client";

import { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
// import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";

export function checkYouTubeId(url: string) {
  const id = getYouTubeId(url);
  return id.length === 11 && /^[-_\w]{11}$/.test(id);
}
export function getYouTubeId(url: string) {
  if (url.startsWith("https://www.youtube.com/watch?v=")) {
    const v = url.slice(32);
    if (v.includes("&")) {
      return v.slice(0, v.indexOf("&"));
    } else {
      return v;
    }
  } else if (url.startsWith("https://youtu.be/")) {
    const v = url.slice(17);
    if (v.includes("?")) {
      return v.slice(0, v.indexOf("?"));
    } else {
      return v;
    }
  } else {
    return url;
  }
}

interface Props {
  className?: string;
  style?: object;
  isMobile: boolean;
  control: boolean;
  id?: string;
  ytPlayer: { current?: YouTubePlayer };
  onReady?: () => void;
  onStart?: () => void;
  onStop?: () => void;
}
export function FlexYouTube(props: Props) {
  const { isMobile, id, control, ytPlayer, onReady, onStart, onStop } = props;
  const { width, height, ref } = useResizeDetector();
  const resizeYouTube = useRef<() => void>();
  const onReadyRef = useRef<() => void>();
  const onStartRef = useRef<() => void>();
  const onStopRef = useRef<() => void>();
  useEffect(() => {
    resizeYouTube.current = () => {
      console.log("resize");
      if (ytPlayer.current) {
        if (width && height) {
          const iframe = ytPlayer.current.getIframe();
          iframe.width = String(width);
          iframe.height = String((width * 9) / 16);
        }
      }
    };
    resizeYouTube.current();
  }, [width, height, ytPlayer]);

  onReadyRef.current = onReady;
  onStartRef.current = onStart;
  onStopRef.current = onStop;

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
        props.className + " relative"
        /* + " flex justify-center items-center"*/
      }
      style={{ ...props.style, height: ((width || 1) * 9) / 16 }}
      ref={ref}
    >
      <div className="absolute inset-0">
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
