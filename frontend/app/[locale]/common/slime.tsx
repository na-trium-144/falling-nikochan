"use client";
import { useEffect, useState } from "react";
import "./slime.css";

interface Props {
  className?: string;
  appearingAnim?: boolean;
  hidden?: boolean;
  duration?: number;
  stopJumping?: boolean;
  noLoop?: boolean;
}
export function SlimeSVG(props: Props) {
  const [id, setId] = useState<number>(0);
  useEffect(() => setId(Math.random()), []);
  const animationParams = (name: string) =>
    props.stopJumping
      ? {}
      : ({
          animationName: name,
          animationIterationCount: props.noLoop ? 1 : "infinite",
          animationDuration: (props.duration || 0.8) + "s",
          animationTimingFunction: "linear",
        } as const);
  return (
    <span
      className={
        props.className
          ? props.className
          : "inline-block w-[1.5em] align-bottom translate-y-[-0.2em] mx-1 "
      }
      style={{
        animationName: props.hidden
          ? "jumping-slime-disappearing"
          : props.appearingAnim
          ? "jumping-slime-appearing"
          : "none",
        animationIterationCount: 1,
        animationDuration: "0.25s",
        animationTimingFunction: props.hidden ? "ease-out" : "ease-in",
        animationFillMode: "forwards",
      }}
    >
      {/*width="117.89705" height="105.69147"*/}
      <svg viewBox="0 0 31.193595 27.9642" version="1.1">
        <linearGradient
          id={`slime-linearGradient-${id}`}
          x1="14.423388"
          y1="8.3200769"
          x2="14.423388"
          y2="28.153481"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(-3.2020473,-7.3288134)"
        >
          <stop style={{ stopColor: "#ffffff", stopOpacity: 1 }} offset="0" />
          <stop style={{ stopColor: "#d9d9d9", stopOpacity: 1 }} offset="1" />
        </linearGradient>
        <g
          style={{
            display: "inline",
            ...animationParams("jumping-slime-g"),
            transform: props.stopJumping
              ? "translate(0.89262405px, 7.3910782px)"
              : undefined,
          }}
        >
          <path
            style={{
              fill: `url(#slime-linearGradient-${id})`,
              fillOpacity: 1,
              stroke: "#000000",
              strokeWidth: 0.79375,
              strokeDasharray: "none",
              strokeOpacity: 1,
              ...animationParams("jumping-slime-path1"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="M 24.117359, 20.579412 9.1294207, 20.624342 C 6.7855803, 20.631372 5.4323955, 19.338537 3.9131368, 17.819278 1.4707844, 15.376925 -0.30277821, 11.624427 1.5129821, 6.9817346 3.1719748, 2.7398796 6.8445837, 0.69163236 11.023557, 0.8878605 c 4.178979, 0.1962283 9.502869, 3.8691081 12.041355, 6.6614421 2.538489, 2.7923344 4.689137, 6.3284184 4.689137, 9.2830964 0, 2.883996 -1.941778, 3.747013 -3.63669, 3.747013 z"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: 1.32292,
              strokeLinecap: "round",
              strokeDasharray: "none",
              strokeOpacity: 1,
              ...animationParams("jumping-slime-path2"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="M 4.7100992,7.6199886 4.4146485,10.120541"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: 1.32292,
              strokeLinecap: "round",
              strokeDasharray: "none",
              strokeOpacity: 1,
              paintOrder: "normal",
              ...animationParams("jumping-slime-path3"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="m 11.21825,6.8320686 -0.245081,2.663853"
          />
          <path
            style={{
              fill: "none",
              stroke: "#ff8613",
              strokeWidth: 0.79375,
              strokeLinecap: "round",
              strokeDasharray: "none",
              strokeOpacity: 1,
              ...animationParams("jumping-slime-path5"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="M 3.1967368,13.275237 4.2356253,13.11123"
          />
          <path
            style={{
              fill: "none",
              stroke: "#ff8513",
              strokeWidth: 0.79375,
              strokeLinecap: "round",
              strokeDasharray: "none",
              strokeOpacity: 1,
              ...animationParams("jumping-slime-path6"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="m 13.527749,11.920744 1.228252,-0.144669"
          />
          <path
            style={{
              display: "inline",
              fill: "#cd2020",
              fillOpacity: 1,
              stroke: "#000000",
              strokeWidth: 0.661458,
              strokeLinecap: "round",
              strokeDasharray: "none",
              strokeOpacity: 1,
              paintOrder: "normal",
              ...animationParams("jumping-slime-path9"),
              transform: props.stopJumping
                ? "translate(-0.37676542px, -0.47836664px)"
                : undefined,
            }}
            d="m 11.041013,15.549374 c 0.479247,-0.280742 0.786049,-0.798168 0.816349,-0.774216 0.03346,0.02645 -0.248579,0.437405 -0.817836,0.771237 -0.608443,0.356811 -0.850495,0.420792 -1.4199473,0.45028 -0.7775086,0.04026 -1.3837007,-0.185539 -1.3722195,-0.202459 0.011724,-0.01728 0.7494177,0.227577 1.3759797,0.199758 0.6130731,-0.02722 0.9384711,-0.163885 1.4176741,-0.4446 z"
          />
        </g>
      </svg>
    </span>
  );
}
