"use client";

import { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { YouTubePlayer } from "./youtubePlayer";
// import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";

interface Props {
  className?: string;
  style?: object;
  isMobile: boolean;
  id?: string;
  ytPlayer: { current: YouTubePlayer | null };
  onReady?: () => void;
  onStart?: () => void;
  onStop?: () => void;
}
export default function FlexYouTube(props: Props) {
  const { isMobile, id, ytPlayer, onReady, onStart, onStop } = props;
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
            controls: 0,
            disablekb: 1,
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
  }, [id]);
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
