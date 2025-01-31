"use client";

import { FlexYouTube, YouTubePlayer } from "@/common/youtube";
import { useRef } from "react";

interface Props {
  ytId: string;
}
export function FlexYouTubeShare(props: Props) {
  const ytPlayer = useRef<YouTubePlayer>(undefined);
  return (
    <FlexYouTube
      fixedSide="width"
      className={
        "my-2 w-full " + "main-wide:basis-1/3 " + "share-yt-wide:w-80 "
      }
      id={props.ytId}
      control={true}
      ytPlayer={ytPlayer}
    />
  );
}
