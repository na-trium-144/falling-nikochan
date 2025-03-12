import { useEffect, useRef } from "react";

interface Props {
  bpm: number;
  top: number;
}
export function BGCloud(props: Props) {
  const ref = useRef<HTMLDivElement>(null!);
  const anim = useRef<Animation | null>(null);
  useEffect(() => {
    anim.current = ref.current.animate(
      [
        { opacity: 0, transform: `translateX(150vw)` },
        {
          opacity: Math.max(0, 1 - props.top / 0.5),
          transform: "translateX(-100%)",
          offset: 0.9,
        },
        { opacity: 0, transform: "translateX(-100%)" },
      ],
      {
        duration: 1e10 / window.innerWidth,
        iterations: Infinity,
        easing: "linear",
        iterationStart: Math.random() * 0.9,
      }
    );
    return () => {
      anim.current?.cancel();
      anim.current = null;
    };
  }, [props.top]);
  useEffect(() => {
    if (anim.current) {
      anim.current.playbackRate = props.bpm;
    }
  }, [props.bpm]);
  return (
    <div
      ref={ref}
      className={
        "absolute -z-50 w-36 h-9 " +
        "bg-linear-to-b from-white to-slate-200 " +
        "shadow-slate-200/50 "
      }
      style={{
        borderRadius: "50%",
        top: props.top * 100 + "%",
        left: 0,
        opacity: 0,
        boxShadow: "0 0 0.3rem 0.3rem var(--tw-shadow-color)",
      }}
    ></div>
  );
}
