"use client";
import { memo, useEffect, useRef, useState } from "react";
import clsx from "clsx/lite";

interface Props {
  className?: string;
  // appearingAnimがtrueの場合、hiddenを切り替えることで出現と消滅のアニメーションをする。
  // falseの場合常時表示する
  appearingAnim?: boolean;
  hidden?: boolean;
  // noLoopの場合、 jumpingMidの時刻で最高点になるようジャンプを開始
  jumpingMid?: DOMHighResTimeStamp | null;
  duration?: number;
  noLoop?: boolean;
}
export function SlimeSVG(props: Props) {
  const [id, setId] = useState<number>(0);
  useEffect(() => setId(Math.random()), []); // linearGradientのidが被らないようにする

  const [csr, setCSR] = useState<boolean>(false);
  useEffect(() => setCSR(true), []);

  const [appearing, setAppearing] = useState<boolean>(false);
  // 1テンポ遅らせる
  useEffect(() => {
    if (csr) {
      setAppearing(!props.hidden);
    }
  }, [csr, props.hidden]);

  return (
    <span
      className={clsx(
        props.className
          ? props.className
          : "inline-block w-[1.5em] align-bottom translate-y-[-0.2em] mx-1",
        props.appearingAnim &&
          clsx(
            "transition-all duration-250 origin-bottom",
            appearing
              ? "ease-in opacity-100 scale-y-100"
              : "ease-out opacity-0 scale-y-0"
          )
      )}
    >
      {csr && <SlimeSVGInner {...props} id={id} />}
    </span>
  );
}
const SlimeSVGInner = memo(function SlimeSVGInner(
  props: Props & { id: number }
) {
  const duration = props.duration || 0.8;
  const smilAnimationParams = {
    dur: duration + "s",
    repeatCount: props.noLoop ? 1 : "indefinite",
    begin: props.noLoop ? "indefinite" : "0s",
    fill: "remove",
  } as const;
  const smilAnimationValues = (params: string[]) =>
    [2, 0, 1, 3, 4, 3, 2, 2].map((i) => params[i]).join(";");
  const lgy1AnimRef = useRef<SVGAnimateElement>(null!);
  const lgy2AnimRef = useRef<SVGAnimateElement>(null!);
  const p1AnimRef = useRef<SVGAnimateElement>(null!);
  const p2AnimRef = useRef<SVGAnimateElement>(null!);
  const p3AnimRef = useRef<SVGAnimateElement>(null!);
  const p5AnimRef = useRef<SVGAnimateElement>(null!);
  const p6AnimRef = useRef<SVGAnimateElement>(null!);
  const p9AnimRef = useRef<SVGAnimateElement>(null!);
  const prevJumpingMid = useRef<DOMHighResTimeStamp | null>(null);
  useEffect(() => {
    if (
      props.noLoop &&
      props.jumpingMid &&
      (prevJumpingMid.current === null ||
        prevJumpingMid.current < props.jumpingMid)
    ) {
      prevJumpingMid.current = props.jumpingMid;
      let jumpStart =
        props.jumpingMid / 1000 - (duration * 4) / 8 - performance.now() / 1000;
      if (jumpStart < 0) {
        // return;
        jumpStart = 0;
      }
      for (const ref of [
        lgy1AnimRef,
        lgy2AnimRef,
        p1AnimRef,
        p2AnimRef,
        p3AnimRef,
        p5AnimRef,
        p6AnimRef,
        p9AnimRef,
      ]) {
        ref.current.beginElementAt(jumpStart);
      }
    } else if (!props.jumpingMid) {
      prevJumpingMid.current = null;
    }
  }, [props.jumpingMid, duration, props.noLoop]);
  return (
    <svg viewBox="0 0 29.063847 28.232059">
      <linearGradient
        id={`slime-linearGradient-${props.id}`}
        x1="14.423388"
        y1="8.3200769"
        x2="14.423388"
        y2="28.153481"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(-3.2020473,-7.3288134)"
      >
        <animate
          ref={lgy1AnimRef}
          attributeName="y1"
          values={smilAnimationValues([
            "12.304124",
            "8.3200769",
            "8.3200769",
            "4.5573659",
            "0.47395998",
          ])}
          {...smilAnimationParams}
        />
        <animate
          ref={lgy2AnimRef}
          attributeName="y2"
          values={smilAnimationValues([
            "28.153481",
            "28.153481",
            "28.153481",
            "28.153481",
            "21.67449",
          ])}
          {...smilAnimationParams}
        />
        <stop style={{ stopColor: "#ffffff", stopOpacity: 1 }} offset="0" />
        <stop style={{ stopColor: "#d9d9d9", stopOpacity: 1 }} offset="1" />
      </linearGradient>
      <g transform="translate(0.7193101,7.2557724)">
        <path
          style={{
            fill: `url(#slime-linearGradient-${props.id})`,
            fillOpacity: 1,
            stroke: "#000000",
            strokeWidth: 0.79375,
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          d="m 21.747669,20.579412 c 0,0 -7.597874,-4.12e-4 -11.364908,-4.12e-4 -3.7670346,0 -5.3116111,-1.508499 -6.4696242,-2.759722 C 1.9930435,15.744634 -0.30277821,11.624427 1.5129821,6.9817346 3.1719748,2.7398796 6.9983396,0.8878605 11.023557,0.8878605 c 4.183584,0 7.664804,3.0387527 9.237921,4.2650201 1.573117,1.2262674 6.176077,5.4417234 6.176077,9.8308504 0,3.71652 -2.292859,5.587146 -4.689886,5.595681 z"
        >
          <animate
            ref={p1AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "m 24.052565,20.579412 c 0,0 -14.04971,-4.12e-4 -17.4848042,-4.12e-4 -3.4350944,0 -4.9971181,-2.123877 -5.436395,-2.759722 C 0.17669073,16.437405 -1.1831284,13.509959 0.4002737,9.7635056 2.1734257,5.5680887 6.9983396,4.8618191 11.023557,4.8618191 c 4.183584,0 8.229102,2.2589169 9.237921,2.7549158 1.008819,0.4959989 7.686181,4.2023181 7.686181,8.9565791 0,3.749714 -2.825544,4.006098 -3.895094,4.006098 z",
              "m 21.747669,20.579412 c 0,0 -7.597874,-4.12e-4 -11.364908,-4.12e-4 -3.7670346,0 -5.3116111,-1.508499 -6.4696242,-2.759722 C 1.9930435,15.744634 -0.30277821,11.624427 1.5129821,6.9817346 3.1719748,2.7398796 6.9983396,0.8878605 11.023557,0.8878605 c 4.183584,0 7.664804,3.0387527 9.237921,4.2650201 1.573117,1.2262674 6.176077,5.4417234 6.176077,9.8308504 0,3.71652 -2.292859,5.587146 -4.689886,5.595681 z",
              "m 21.747669,20.579412 c 0,0 -7.597874,-4.12e-4 -11.364908,-4.12e-4 -3.7670346,0 -5.3116111,-1.508499 -6.4696242,-2.759722 C 1.9930435,15.744634 -0.30277821,11.624427 1.5129821,6.9817346 3.1719748,2.7398796 6.9983396,0.8878605 11.023557,0.8878605 c 4.183584,0 7.664804,3.0387527 9.237921,4.2650201 1.573117,1.2262674 6.176077,5.4417234 6.176077,9.8308504 0,3.71652 -2.292859,5.587146 -4.689886,5.595681 z",
              "m 16.656943,20.579412 c 0,0 -0.736459,-4.12e-4 -4.614162,-4.12e-4 -3.8777031,0 -7.192967,-4.053862 -8.3509801,-5.305085 C 1.7717076,13.199271 -0.19211024,8.0830521 1.6236501,3.4403597 c 1.6589927,-4.24185504 5.3746895,-6.425878 9.3999069,-6.425878 4.183584,0 7.664804,1.7107371 9.237921,2.93700446 1.573117,1.22626744 5.733405,4.11370784 5.733405,10.60552584 0,5.155204 -4.727547,10.0224 -9.33794,10.0224 z",
              "m 15.493413,14.438449 c 0,0 -1.593599,-0.07493 -3.036606,-0.07493 -1.443008,0 -5.661889,-1.086459 -8.5436702,-4.180331 C 1.9864317,8.1146832 0.04565088,3.8776693 1.8614112,-0.76502307 3.5204039,-5.0068781 6.9983396,-6.8588972 11.023557,-6.8588972 c 4.183584,0 7.664804,1.7107371 9.237921,2.9370045 1.573117,1.2262674 5.089741,4.11463732 5.180065,8.5028348 0.110668,5.3765395 -3.023536,9.8351789 -9.94813,9.8575069 z",
            ])}
            {...smilAnimationParams}
          />
        </path>
        <path
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 1.32292,
            strokeLinecap: "round",
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          d="M 7.1907785,8.2637185 6.8953278,10.76427"
        >
          <animate
            ref={p2AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "M 7.1907785,9.3220518 6.8953278,11.822603",
              "M 7.1907785,8.2637185 6.8953278,10.76427",
              "M 7.1907785,8.2637185 6.8953278,10.76427",
              "M 7.1907785,3.5012182 6.8953278,6.0017694",
              "M 7.1907785,-0.73211524 6.8953278,1.7684358",
            ])}
            {...smilAnimationParams}
          />
        </path>
        <path
          style={{
            fill: "none",
            stroke: "#000000",
            strokeWidth: 1.32292,
            strokeLinecap: "round",
            strokeDasharray: "none",
            strokeOpacity: 1,
            paintOrder: "normal",
          }}
          d="m 14.67126,8.26346 -0.245081,2.663853"
        >
          <animate
            ref={p3AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "M 14.67126,9.3217933 14.426179,11.985646",
              "m 14.67126,8.26346 -0.245081,2.663853",
              "m 14.67126,8.26346 -0.245081,2.663853",
              "M 14.67126,3.5009597 14.426179,6.1648124",
              "M 14.67126,-0.73237374 14.426179,1.9314788",
            ])}
            {...smilAnimationParams}
          />
        </path>
        <path
          style={{
            fill: "#cd2020",
            fillOpacity: 1,
            stroke: "#000000",
            strokeWidth: 0.661458,
            strokeLinecap: "round",
            strokeDasharray: "none",
            strokeOpacity: 1,
            paintOrder: "normal",
          }}
          d="m 12.555721,14.858298 c 0.121533,0.165707 -0.602407,0.659327 -0.96605,0.760219 -0.44494,0.123449 -1.315723,0.181422 -1.641947,0.131865 -0.337103,-0.05121 -1.5976124,-0.332028 -1.5709407,-0.425656 0.023415,-0.08219 0.914277,0.305975 1.5868505,0.346302 0.5851222,0.03508 0.9254412,0.09488 1.6030972,-0.176451 0.715975,-0.286673 0.886251,-0.776361 0.98899,-0.636279 z"
        >
          <animate
            ref={p9AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "m 12.846714,16.286987 c 0.121533,0.165707 -0.8934,0.288972 -1.257043,0.389864 -0.44494,0.123449 -1.315723,0.181422 -1.641947,0.131865 -0.337103,-0.05121 -1.6240663,-0.133624 -1.5973946,-0.227252 0.023415,-0.08219 0.9402624,0.116341 1.6133044,0.147898 0.4660792,0.02185 0.8769732,0.02012 1.5898702,-0.13677 0.821791,-0.180858 1.190471,-0.445687 1.29321,-0.305605 z",
              "m 12.177655,14.117355 c 0.50968,-0.137018 0.824806,0.300286 0.614026,0.873038 -0.179163,0.486842 -0.736331,0.819368 -1.177936,0.939471 -0.365058,0.09928 -1.058464,0.148516 -1.524783,0.08352 C 9.3791376,15.914441 8.7653435,15.509768 8.4734692,15.116905 8.052344,14.550071 8.322279,14.22837 9.1882011,14.265202 c 0.7953632,0.03383 2.3213839,0.03175 2.9894539,-0.147847 z",
              "m 12.555721,14.858298 c 0.121533,0.165707 -0.602407,0.659327 -0.96605,0.760219 -0.44494,0.123449 -1.315723,0.181422 -1.641947,0.131865 -0.337103,-0.05121 -1.5976124,-0.332028 -1.5709407,-0.425656 0.023415,-0.08219 0.914277,0.305975 1.5868505,0.346302 0.5851222,0.03508 0.9254412,0.09488 1.6030972,-0.176451 0.715975,-0.286673 0.886251,-0.776361 0.98899,-0.636279 z",
              "m 11.545929,10.932241 c 1.11059,-0.04457 1.60795,0.249894 1.578406,1.314339 -0.01868,0.673058 -0.242791,1.712198 -0.42018,2.045287 -0.501802,0.942253 -1.73571,1.053781 -2.676825,0.416172 C 9.4173856,14.2948 8.8018894,13.629536 8.3810214,13.118205 7.5414776,12.098208 8.1373834,11.258968 9.3422808,11.110904 c 0.7901382,-0.0971 1.5124142,-0.150921 2.2036482,-0.178663 z",
              "m 11.545929,5.6405737 c 1.11059,-0.04457 1.60795,0.2498937 1.578406,1.3143381 -0.01868,0.6730577 -0.242791,1.7121971 -0.42018,2.0452858 -0.501802,0.9422527 -1.73571,1.0537804 -2.676825,0.416172 C 9.4173856,9.0031306 8.8018894,8.3378672 8.3810214,7.8265365 7.5414776,6.8065401 8.1373834,5.9673004 9.3422808,5.8192364 10.132419,5.7221367 10.854695,5.6683157 11.545929,5.6405737 Z",
            ])}
            {...smilAnimationParams}
          />
        </path>
        <path
          style={{
            fill: "none",
            stroke: "#ff8613",
            strokeWidth: 0.79375,
            strokeLinecap: "round",
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          d="m 4.2201921,12.917643 1.0505877,-0.04953"
        >
          <animate
            ref={p5AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "m 4.2201921,14.505144 1.0505877,-0.04953",
              "m 4.2201921,12.917643 1.0505877,-0.04953",
              "m 4.2201921,12.917643 1.0505877,-0.04953",
              "m 4.2201921,9.7426413 1.0505877,-0.04953",
              "m 4.2201921,4.4509743 1.0505877,-0.04953",
            ])}
            {...smilAnimationParams}
          />
        </path>
        <path
          style={{
            fill: "none",
            stroke: "#ff8513",
            strokeWidth: 0.79375,
            strokeLinecap: "round",
            strokeDasharray: "none",
            strokeOpacity: 1,
          }}
          d="m 15.995741,12.931365 1.235112,-0.06349"
        >
          <animate
            ref={p6AnimRef}
            attributeName="d"
            values={smilAnimationValues([
              "m 15.995741,14.518866 1.235112,-0.06349",
              "m 15.995741,12.931365 1.235112,-0.06349",
              "m 15.995741,12.931365 1.235112,-0.06349",
              "m 15.995741,9.7563633 1.235112,-0.06349",
              "m 15.995741,4.4646963 1.235112,-0.06349",
            ])}
            {...smilAnimationParams}
          />
        </path>
      </g>
    </svg>
  );
});
