"use client";

import { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { YouTubePlayer } from "./youtubePlayer";
// import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";

interface Props {
  className?: string;
  style?: object;
  id?: string;
}
export default function FlexYouTube(props: Props) {
  const { id } = props;
  const ytPlayer = useRef<YouTubePlayer | null>(null);
  const { width, height, ref } = useResizeDetector();
  const resizeYouTube = useRef<() => void>(() => undefined);
  useEffect(() => {
    resizeYouTube.current = () => {
      if (ytPlayer.current) {
        if (width && height) {
          const iframe = ytPlayer.current.getIframe();
          iframe.width = String(width);
          iframe.height = String((width * 9) / 16);
        }
      }
    };
    resizeYouTube.current();
  }, [width, height]);

  useEffect(() => {
    if (id) {
      const loadVideo = () => {
        // the Player object is created uniquely based on the id in props
        // https://developers.google.com/youtube/iframe_api_reference?hl=ja#Loading_a_Video_Player
        ytPlayer.current = new (window as any).YT.Player("youtube-player", {
          width: 1,
          height: 1,
          videoId: id,
          events: {
            onReady: resizeYouTube.current,
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
        props.className + " overflow-hidden"
        /* + " flex justify-center items-center"*/
      }
      style={props.style}
      ref={ref}
    >
      <div id="youtube-player" />
    </div>
  );
}
