"use client";

import { memo } from "react";

export function FourthNote() {
  return <FourthNoteInner />;
}
const FourthNoteInner = memo(function FourthNoteInner() {
  return (
    <svg
      className="inline-block"
      style={{
        transform: "translateY(-0.125em)",
        height: "0.9em",
        width: (13.5 / 41) * 0.9 + "em",
      }}
      viewBox="0 0 13.453132 41.015644"
    >
      <defs id="defs1" />
      <g id="layer1">
        <path
          d="M 13.453131,2.8312206e-7 V 31.026057 q 0,4.484377 -2.697918,7.255212 -2.6614592,2.734376 -6.5625028,2.734376 -2.0781259,0 -3.1354181,-0.984376 Q -8.9406967e-8,39.046894 -8.9406967e-8,37.36981 q 0,-2.807293 2.260417789406967,-4.921878 2.2968761,-2.114584 5.1406274,-2.114584 1.6041674,0 3.2812519,0.692709 V 0.03645863 Z"
          id="text1"
          fill="currentColor"
        />
      </g>
    </svg>
  );
});
