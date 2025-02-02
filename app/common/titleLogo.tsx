"use client";

import { useEffect, useState } from "react";
import TargetLine from "./targetLine.js";

interface Props {
  anim: boolean;
  className?: string;
}
export default function Title(props: Props) {
  const [nikochanPhase, setNikochanPhase] = useState<number>(
    props.anim ? 0 : 2
  );
  const [barFlash, setBarFlash] = useState<boolean>(props.anim ? false : true);
  useEffect(() => {
    if (nikochanPhase === 0) {
      requestAnimationFrame(() => setNikochanPhase(1));
      setTimeout(
        () =>
          requestAnimationFrame(() => {
            setNikochanPhase(2);
            setBarFlash(true);
          }),
        300
      );
    }
  }, [nikochanPhase]);

  return (
    <div className={"leading-none text-center mx-auto w-96 " + props.className}>
      <TargetLine barFlash={barFlash} left={0} right={0} bottom="2.2rem" />
      <span className="text-4xl inline-block absolute inset-x-0 w-max m-auto bottom-7 ">
        Falling Nikochan
      </span>
      <div
        className={
          "absolute " +
          (nikochanPhase === 0
            ? "-translate-y-28 translate-x-14 opacity-0 "
            : nikochanPhase === 1
            ? "transition-transform ease-linear duration-300"
            : "")
        }
        style={{
          /* noteSize: にこちゃんのサイズ(boxSizeに対する比率), boxSize: 画面のサイズ */
          width: "1.5rem",
          height: "1.5rem",
          right: "1rem",
          bottom: "1.55rem",
        }}
      >
        <img
          src={
            process.env.ASSET_PREFIX +
            `/assets/nikochan${[0, 0, 1][nikochanPhase]}.svg`
          }
          className="w-full h-full "
        />
      </div>
      <span
        className="absolute border-b origin-bottom-right border-gray-300 -z-10 "
        style={{
          width: "12rem",
          right: 1 + 1.5 / 2 + 1 + "rem",
          bottom: 1.55 + 1.5 / 2 - 2 + "rem",
          transform: `rotate(${Math.atan2(2, -1)}rad)`,
        }}
      />
    </div>
  );
}
