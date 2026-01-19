"use client";

import { useTheme } from "@/common/theme";
import { useDisplayMode } from "@/scale";
import clsx from "clsx/lite";
import { memo, useEffect, useState } from "react";

interface Props {
  classNameNear?: string;
  classNameFar?: string;
  style?: object;
  height: number;
}
export function IrasutoyaLikeGrass(props: Props) {
  const { rem, screenWidth, screenHeight } = useDisplayMode();
  const { isDark } = useTheme();
  return (
    <IrasutoyaLikeGrassInner
      {...props}
      rem={rem}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      isDark={isDark}
    />
  );
}
const IrasutoyaLikeGrassInner = memo(function IrasutoyaLikeGrassInner(
  props: Props & {
    rem: number;
    screenWidth: number;
    screenHeight: number;
    isDark: boolean;
  }
) {
  const { rem, screenWidth, screenHeight, isDark } = props;
  const cellWidth = 3.5; // * rem;
  const cellHeight = 2.5; // * rem;
  const patternCols = 10;
  const patternRows = 6;
  interface Params {
    roughEdgeSeed1: number;
    roughEdgeSeed2: number;
    randomCurveSeed1: number;
    randomCurveSeed2: number;
    paperTextureSeed: number;
    grassTufts: {
      x: number;
      y: number;
      w: number;
      h: number;
      rx: number;
      ry: number;
    }[];
  }
  const [p, setP] = useState<Params | null>(null);
  useEffect(() => {
    // 草のパターン生成（グリッド・ジッター法）
    const grassTufts = [];

    for (let r = 0; r < patternRows; r++) {
      for (let c = 0; c < patternCols; c++) {
        // 基本的な草のサイズ
        const baseW = cellWidth * 0.15 * (1 + Math.random() * 0.25);
        const baseH = cellWidth * 0.2 * (1 + Math.random() * 0.75);
        // セル内のランダムな位置（はみ出し防止のマージンを考慮）
        const margin = cellWidth * 0.05;
        const x =
          c * cellWidth +
          margin +
          Math.random() * (cellWidth - baseW - margin * 2);
        const y =
          r * cellHeight +
          margin +
          Math.random() * (cellHeight - baseH - margin * 2);
        grassTufts.push({
          x,
          y,
          w: baseW,
          h: baseH,
          rx: baseW / 2, // 丸みも幅に合わせて調整
          ry: baseH / 2,
        });
      }
    }
    setP({
      roughEdgeSeed1: Math.floor(Math.random() * 1000),
      roughEdgeSeed2: Math.floor(Math.random() * 1000),
      randomCurveSeed1: Math.floor(Math.random() * 1000),
      randomCurveSeed2: Math.floor(Math.random() * 1000),
      paperTextureSeed: Math.floor(Math.random() * 1000),
      grassTufts,
    });
  }, []);

  if (!p) {
    return null;
  }
  return (
    <>
      <svg
        className={clsx("absolute pointer-events-none", props.classNameFar)}
        style={{
          left: "-2.5rem",
          right: "-2.5rem",
          bottom: "-2.5rem",
          height: "calc(100vh + 2.5rem)",
        }}
        viewBox={`0 0 ${screenWidth + 5 * rem} ${screenHeight + 2.5 * rem}`}
      >
        <defs>
          <filter id="roughEdge2" x="0" y="-20%" width="100%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05"
              numOctaves="1"
              seed={p.roughEdgeSeed2 ?? 1}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="randomCurve2" x="0" y="-20%" width="100%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.005"
              numOctaves="1"
              seed={p.randomCurveSeed2 ?? 3}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={5 * rem}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="paperTexture" x="-0%" y="-0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.5"
              numOctaves="1"
              seed={p.paperTextureSeed ?? 5}
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.3 0"
              in="noise"
              result="softNoise"
            />
            <feBlend
              mode="multiply"
              in="SourceGraphic"
              in2="softNoise"
              result="blended"
            />
            <feComposite operator="in" in="blended" in2="SourceGraphic" />
          </filter>
        </defs>

        <g filter="url(#paperTexture)">
          <g filter="url(#roughEdge2)">
            <g filter="url(#randomCurve2)">
              {/* Firefoxでfilterの適用範囲が正しくならないバグがあるので、
            透明なrectを追加して強制的に範囲を広げる */}
              <rect
                x="0"
                y={screenHeight - props.height - 2.5 * rem}
                width="100%"
                height={5 * rem}
                fill="transparent"
              />
              <rect
                x="0"
                y={screenHeight - props.height}
                width="100%"
                height={2.5 * rem}
                fill={
                  isDark ? "var(--color-lime-900)" : "var(--color-lime-600)"
                }
              />
            </g>
          </g>
        </g>
      </svg>
      <svg
        className={clsx("absolute pointer-events-none", props.classNameNear)}
        style={{
          left: "-2.5rem",
          right: "-2.5rem",
          bottom: "-2.5rem",
          height: "calc(100vh + 2.5rem)",
        }}
        viewBox={`0 0 ${screenWidth + 5 * rem} ${screenHeight + 2.5 * rem}`}
      >
        <defs>
          <pattern
            id="grassPattern"
            x="0"
            y={screenHeight - props.height + 0.5 * rem}
            width={cellWidth * patternCols * rem}
            height={cellHeight * patternRows * rem}
            patternUnits="userSpaceOnUse"
          >
            <g
              fill={isDark ? "var(--color-lime-600)" : "var(--color-lime-200)"}
              fillOpacity="0.3"
            >
              {p.grassTufts.map((tuft, index) => (
                <rect
                  key={index}
                  x={tuft.x * rem}
                  y={tuft.y * rem}
                  width={tuft.w * rem}
                  height={tuft.h * rem}
                  rx={tuft.rx * rem}
                  ry={tuft.ry * rem}
                />
              ))}
            </g>
          </pattern>

          <filter id="roughEdge" x="0" y="-20%" width="100%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.1"
              numOctaves="3"
              seed={p.roughEdgeSeed1 ?? 0}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="randomCurve" x="0" y="-20%" width="100%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003"
              numOctaves="1"
              seed={p.randomCurveSeed1 ?? 1}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={2 * rem}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          <filter id="paperTexture" x="-0%" y="-0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.5"
              numOctaves="1"
              seed={p.paperTextureSeed ?? 5}
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.3 0"
              in="noise"
              result="softNoise"
            />
            <feBlend
              mode="multiply"
              in="SourceGraphic"
              in2="softNoise"
              result="blended"
            />
            <feComposite operator="in" in="blended" in2="SourceGraphic" />
          </filter>

          <linearGradient id="grassGradient" gradientTransform="rotate(90)">
            <stop
              offset="0%"
              stopColor={
                isDark ? "var(--color-lime-700)" : "var(--color-lime-300)"
              }
            />
            <stop
              offset="50%"
              stopColor={
                isDark ? "var(--color-lime-800)" : "var(--color-lime-500)"
              }
            />
            <stop
              offset="100%"
              stopColor={
                isDark ? "var(--color-lime-900)" : "var(--color-lime-600)"
              }
            />
          </linearGradient>
        </defs>

        <g filter="url(#paperTexture)">
          <g filter="url(#roughEdge)">
            <g filter="url(#randomCurve)">
              <rect
                x="0"
                y={screenHeight - props.height - 2.5 * rem}
                width="100%"
                height={5 * rem}
                fill="transparent"
              />
              <rect
                x="0"
                y={screenHeight - props.height}
                width="100%"
                height={props.height + 2.5 * rem}
                fill="url(#grassGradient)"
              />
            </g>
          </g>
          <rect
            x="0"
            y={screenHeight - props.height + 0.5 * rem}
            width="100%"
            height={props.height + 2 * rem}
            fill="url(#grassPattern)"
          />
        </g>
      </svg>
    </>
  );
});
