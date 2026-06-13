"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  className: string;
}
export function LazyImg(props: Props) {
  const [loadImages, setLoadImages] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setLoadImages(true))
    );
  }, []);

  if (loadImages) {
    return (
      <img
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className={props.className}
        src={props.src}
      />
    );
  }
  return null;
}
