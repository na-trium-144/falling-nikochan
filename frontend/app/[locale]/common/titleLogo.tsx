"use client";

import clsx from "clsx/lite";
import { useEffect, useState } from "react";
import TargetLine from "./targetLine.js";
import Link from "next/link.js";

interface Props {
  anim?: boolean;
  className?: string;
}
export default function Title(props: Props) {
  const [nikochanPhase, setNikochanPhase] = useState<number>(
    props.anim ? 0 : 2
  );
  const [nikochanPhaseNext, setNikochanPhaseNext] = useState<number>(
    props.anim ? 0 : 2
  );
  useEffect(() => {
    const i = requestAnimationFrame(() => setNikochanPhase(nikochanPhaseNext));
    return () => {
      cancelAnimationFrame(i);
    };
  }, [nikochanPhaseNext]);
  const [barFlash, setBarFlash] = useState<boolean>(props.anim ? false : true);
  useEffect(() => {
    if (nikochanPhase === 0) {
      setNikochanPhaseNext(1);
      setTimeout(
        () =>
          requestAnimationFrame(() => {
            setNikochanPhase(2);
            setNikochanPhaseNext(2);
            setBarFlash(true);
          }),
        300
      );
    }
  }, [nikochanPhase]);

  return (
    <div className={clsx("fn-title", props.className)}>
      <TargetLine
        barFlash={barFlash ? "100% - 1.75rem" : undefined}
        left={0}
        right={0}
        bottom="2.2rem"
      />
      <h1>Falling Nikochan</h1>
      <img
        className={clsx(
          nikochanPhase === 0 && "phase-0",
          nikochanPhase === 1 && "phase-1",
          nikochanPhase === 2 && "phase-2"
        )}
        src={
          process.env.ASSET_PREFIX +
          `/assets/nikochan${[0, 0, 1][nikochanPhase]}.svg?v=2`
        }
      />
      <span className="fn-title-diag" />
    </div>
  );
}

export function TitleAsLink(props: { className: string; locale: string }) {
  return (
    <Link
      href={`/${props.locale}`}
      className={clsx("fn-title-main fn-link-1", props.className)}
      prefetch={!process.env.NO_PREFETCH}
    >
      <Title anim />
    </Link>
  );
}
