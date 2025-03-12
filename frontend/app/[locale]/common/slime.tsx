"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  // appearingAnimがtrueの場合、hiddenを切り替えることで出現と消滅のアニメーションをする。
  // falseの場合常時表示する
  appearingAnim?: boolean;
  hidden?: boolean;
  // noLoopの場合、 jumpingMidの時刻で最高点になるようジャンプを開始
  jumpingMid?: Date | null;
  duration?: number;
  noLoop?: boolean;
}
export function SlimeSVG(props: Props) {
  const [id, setId] = useState<number>(0);
  useEffect(() => setId(Math.random()), []); // linearGradientのidが被らないようにする

  const [appearing, setAppearing] = useState<boolean>(false);
  // 1テンポ遅らせる
  useEffect(() => setAppearing(!props.hidden), [props.hidden]);

  const duration = props.duration || 0.8;
  const smilAnimationParams = {
    dur: duration + "s",
    repeatCount: props.noLoop ? 1 : "indefinite",
    begin: props.noLoop ? "indefinite" : "0s",
    fill: "freeze",
  } as const;
  const smilAnimationValues = (params: string[]) =>
    [2, 0, 1, 3, 4, 3, 2, 2].map((i) => params[i]).join(";");
  const gtAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const gt2AnimRef = useRef<SVGAnimateTransformElement>(null!);
  const p1AnimRef = useRef<SVGAnimateElement>(null!);
  const p2AnimRef = useRef<SVGAnimateElement>(null!);
  const p2tAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const p3AnimRef = useRef<SVGAnimateElement>(null!);
  const p3tAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const p5AnimRef = useRef<SVGAnimateElement>(null!);
  const p5tAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const p6AnimRef = useRef<SVGAnimateElement>(null!);
  const p6tAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const p9AnimRef = useRef<SVGAnimateElement>(null!);
  const p9tAnimRef = useRef<SVGAnimateTransformElement>(null!);
  const prevJumpingMid = useRef<Date | null>(null);
  useEffect(() => {
    if (
      props.noLoop &&
      props.jumpingMid &&
      (prevJumpingMid.current === null ||
        prevJumpingMid.current.getTime() < props.jumpingMid.getTime())
    ) {
      prevJumpingMid.current = props.jumpingMid;
      let jumpStart =
        props.jumpingMid.getTime() / 1000 -
        (duration * 4) / 8 -
        new Date().getTime() / 1000;
      if (jumpStart < 0) {
        // return;
        jumpStart = 0;
      }
      for (const ref of [
        gtAnimRef,
        gt2AnimRef,
        p1AnimRef,
        p2AnimRef,
        p2tAnimRef,
        p3AnimRef,
        p3tAnimRef,
        p5AnimRef,
        p5tAnimRef,
        p6AnimRef,
        p6tAnimRef,
        p9AnimRef,
        p9tAnimRef,
      ]) {
        ref.current.beginElementAt(jumpStart);
      }
    }
  }, [props.jumpingMid, duration, props.noLoop]);
  return (
    <span
      className={
        (props.className
          ? props.className
          : "inline-block w-[1.5em] align-bottom translate-y-[-0.2em] mx-1 ") +
        (props.appearingAnim
          ? "transition-all duration-250 " +
            (appearing
              ? "ease-in opacity-100 scale-y-100 "
              : "ease-out opacity-0 scale-y-0 ")
          : "")
      }
    >
      {props.jumpingMid &&
        ((props.jumpingMid.getTime() % 10000) / 1000).toFixed(2)}
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
          }}
          transform="translate(0.89262405, 7.3910782)"
        >
          <animateTransform
            ref={gtAnimRef}
            attributeName="transform"
            type="translate"
            values={smilAnimationValues([
              "0.89262405 11.875645",
              "0.89262405 7.3910782",
              "0.89262405 7.3910782",
              "0.89262405 4.6052854",
              "0.89262405 0.79450622",
            ])}
            {...smilAnimationParams}
          />
          <animateTransform
            ref={gt2AnimRef}
            attributeName="transform"
            type="scale"
            values={smilAnimationValues([
              "1 0.77741435",
              "1 1",
              "1 1",
              "1 1.1384589",
              "1 1.0410332",
            ])}
            {...smilAnimationParams}
            additive="sum"
          />
          <path
            style={{
              fill: `url(#slime-linearGradient-${id})`,
              fillOpacity: 1,
              stroke: "#000000",
              strokeWidth: 0.79375,
              strokeDasharray: "none",
              strokeOpacity: 1,
            }}
            d="M 24.117359, 20.579412 9.1294207, 20.624342 C 6.7855803, 20.631372 5.4323955, 19.338537 3.9131368, 17.819278 1.4707844, 15.376925 -0.30277821, 11.624427 1.5129821, 6.9817346 3.1719748, 2.7398796 6.8445837, 0.69163236 11.023557, 0.8878605 c 4.178979, 0.1962283 9.502869, 3.8691081 12.041355, 6.6614421 2.538489, 2.7923344 4.689137, 6.3284184 4.689137, 9.2830964 0, 2.883996 -1.941778, 3.747013 -3.63669, 3.747013 z"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p1AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "m 27.064005, 20.579412 -20.64737, 0.04493 C 4.1195668, 20.571208 3.047015, 20.481649 1.8551615, 18.541243 -0.06268116, 15.418886 -1.0141064, 10.538602 1.2791213, 6.2597695 3.3590635, 2.378897 6.8445837, 0.69163236 11.023557, 0.8878605 c 4.178979, 0.1962283 9.751896, 2.5574185 12.602621, 4.7963657 2.865894, 2.2508606 6.04553, 6.1479278 6.513252, 9.5237518 0.39338, 2.839258 -0.538614, 5.431598 -3.075425, 5.371434 z",
                "M 24.117359, 20.579412 9.1294207, 20.624342 C 6.7855803, 20.631372 5.4323955, 19.338537 3.9131368, 17.819278 1.4707844, 15.376925 -0.30277821, 11.624427 1.5129821, 6.9817346 3.1719748, 2.7398796 6.8445837, 0.69163236 11.023557, 0.8878605 c 4.178979, 0.1962283 9.502869, 3.8691081 12.041355, 6.6614421 2.538489, 2.7923344 4.689137, 6.3284184 4.689137, 9.2830964 0, 2.883996 -1.941778, 3.747013 -3.63669, 3.747013 z",
                "M 24.117359, 20.579412 9.1294207, 20.624342 C 6.7855803, 20.631372 5.4323955, 19.338537 3.9131368, 17.819278 1.4707844, 15.376925 -0.30277821, 11.624427 1.5129821, 6.9817346 3.1719748, 2.7398796 6.8445837, 0.69163236 11.023557, 0.8878605 c 4.178979, 0.1962283 9.502869, 3.8691081 12.041355, 6.6614421 2.538489, 2.7923344 4.689137, 6.3284184 4.689137, 9.2830964 0, 2.883996 -1.941778, 3.747013 -3.63669, 3.747013 z",
                "m 16.493496,20.579412 -2.406226,0.04493 C 11.74343,20.631342 10.006173,20.21033 6.8597833,18.166517 3.5167997,15.995002 0.46637261,11.745569 1.793615,7.1778658 2.9695225,3.130981 6.9303702,0.32382016 11.023557,0.12234286 17.158012,-0.17961089 22.224794,3.5762343 24.514848,6.6007741 c 2.573557,3.3989694 2.142771,6.9175939 0.292555,9.9963569 -2.133569,3.550263 -6.618995,3.982281 -8.313907,3.982281 z",
                "m 14.219199,20.627149 -0.131929,-0.0028 C 10.620898,20.653806 7.521977,19.443351 5.3677748,17.653692 2.3154077,15.117861 0.84054994,11.835426 1.793615,7.1778658 2.6372288,3.0551857 6.9303702,0.32382016 11.023557,0.12234286 17.158012,-0.17961089 22.173,3.3677541 24.421304,6.4210597 c 2.105835,2.8598262 2.246608,6.5172533 0.666732,9.5470713 -2.184981,4.190263 -7.520279,4.722557 -10.868837,4.659018 z",
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
            d="M 4.7100992,7.6199886 4.4146485,10.120541"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p2AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "M 4.6607389,6.6603119 3.9911109,9.6421743",
                "M 4.7100992,7.6199886 4.4146485,10.120541",
                "M 4.7100992,7.6199886 4.4146485,10.120541",
                "M 5.8534006,5.5652344 5.6928163,7.7876711",
                "M 5.5167528,5.5265437 5.5002975,7.9981719",
              ])}
              {...smilAnimationParams}
            />
            <animateTransform
              ref={p2tAnimRef}
              attributeName="transform"
              type="translate"
              values={smilAnimationValues([
                "0 0",
                "-0.37676542 -0.47836664",
                "-0.37676542 -0.47836664",
                "0 0",
                "0 0",
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
            d="m 11.21825,6.8320686 -0.245081,2.663853"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p3AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "M 11.028573,6.0528833 10.502859,9.1378825",
                "m 11.21825,6.8320686 -0.245081,2.663853",
                "m 11.21825,6.8320686 -0.245081,2.663853",
                "m 11.938115,4.9252604 -0.05709,2.1790617",
                "m 11.537287,4.7044232 -0.04918,2.5390324",
              ])}
              {...smilAnimationParams}
            />
            <animateTransform
              ref={p3tAnimRef}
              attributeName="transform"
              type="translate"
              values={smilAnimationValues([
                "0 0",
                "-0.37676542 -0.47836664",
                "-0.37676542 -0.47836664",
                "0 0",
                "0 0",
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
            d="M 3.1967368,13.275237 4.2356253,13.11123"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p5AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "M 2.6796549,13.578999 3.9991764,13.414992",
                "M 3.1967368,13.275237 4.2356253,13.11123",
                "M 3.1967368,13.275237 4.2356253,13.11123",
                "M 3.8121589,10.879531 4.8510474,10.715524",
                "M 3.8445881,11.10924 4.8847642,10.952946",
              ])}
              {...smilAnimationParams}
            />
            <animateTransform
              ref={p5tAnimRef}
              attributeName="transform"
              type="translate"
              values={smilAnimationValues([
                "0 0",
                "-0.37676542 -0.47836664",
                "-0.37676542 -0.47836664",
                "0 0",
                "0 0",
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
            d="m 13.527749,11.920744 1.228252,-0.144669"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p6AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "m 12.542945,12.344834 1.368569,-0.204833",
                "m 13.527749,11.920744 1.228252,-0.144669",
                "m 13.527749,11.920744 1.228252,-0.144669",
                "M 14.4739,9.060228 15.702152,8.915559",
                "m 13.283207,9.6309843 1.22839,-0.143586",
              ])}
              {...smilAnimationParams}
            />
            <animateTransform
              ref={p6tAnimRef}
              attributeName="transform"
              type="translate"
              values={smilAnimationValues([
                "0 0",
                "-0.37676542 -0.47836664",
                "-0.37676542 -0.47836664",
                "0 0",
                "0 0",
              ])}
              {...smilAnimationParams}
            />
          </path>
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
            }}
            d="m 11.041013,15.549374 c 0.479247,-0.280742 0.786049,-0.798168 0.816349,-0.774216 0.03346,0.02645 -0.248579,0.437405 -0.817836,0.771237 -0.608443,0.356811 -0.850495,0.420792 -1.4199473,0.45028 -0.7775086,0.04026 -1.3837007,-0.185539 -1.3722195,-0.202459 0.011724,-0.01728 0.7494177,0.227577 1.3759797,0.199758 0.6130731,-0.02722 0.9384711,-0.163885 1.4176741,-0.4446 z"
            transform="translate(-0.37676542, -0.47836664)"
          >
            <animate
              ref={p9AnimRef}
              attributeName="d"
              values={smilAnimationValues([
                "m 9.2893906,16.306443 c 0.6591291,-0.188364 1.1197934,-0.609072 1.1566874,-0.58392 0.04074,0.02778 -0.375326,0.357019 -1.1582913,0.581082 -0.8368632,0.239486 -1.1608499,0.265468 -1.9091899,0.219029 -1.021755,-0.06341 -1.788899,-0.341412 -1.77194,-0.354985 0.017318,-0.01386 0.9543087,0.297857 1.7771685,0.353065 0.8051452,0.05402 1.246496,-0.02593 1.9055653,-0.214271 z",
                "m 10.677993,13.818405 c 0.509916,-0.220179 0.604018,-0.443706 0.886344,-0.06141 0.213872,0.289606 0.07898,0.820188 -0.277278,1.37058 -0.383272,0.592131 -1.5336774,1.019564 -2.3341112,0.964159 -0.7766922,-0.05376 -1.7975576,-0.437693 -1.7734713,-0.857467 0.023512,-0.409759 0.256284,-0.480963 0.8743534,-0.587467 0.6144155,-0.105874 2.1059591,-0.604641 2.6241631,-0.828399 z",
                "m 11.041013,15.549374 c 0.479247,-0.280742 0.786049,-0.798168 0.816349,-0.774216 0.03346,0.02645 -0.248579,0.437405 -0.817836,0.771237 -0.608443,0.356811 -0.850495,0.420792 -1.4199473,0.45028 -0.7775086,0.04026 -1.3837007,-0.185539 -1.3722195,-0.202459 0.011724,-0.01728 0.7494177,0.227577 1.3759797,0.199758 0.6130731,-0.02722 0.9384711,-0.163885 1.4176741,-0.4446 z",
                "m 11.521352,11.945333 c 0.540945,-0.125985 0.949423,0.12987 1.018636,0.600052 0.08158,0.554189 0.0152,1.04622 -0.249879,1.751515 -0.249376,0.663527 -1.028669,1.175719 -1.845639,0.921877 C 9.7009809,14.987768 8.1478858,14.539306 7.6755703,13.741537 7.3895304,13.258398 7.569616,12.873779 8.1695851,12.69105 8.7343912,12.51903 10.986612,12.069872 11.521352,11.945333 Z",
                "m 11.322914,11.958224 c 0.540945,-0.125985 0.949423,0.12987 1.018636,0.600052 0.08158,0.554189 0.222131,1.832639 0.08085,2.564932 -0.133621,0.692577 -0.41682,1.146668 -1.23379,0.892826 C 10.445121,15.785025 7.9494483,14.552197 7.4771328,13.754428 7.1910929,13.271289 7.3711785,12.88667 7.9711476,12.703941 8.5359537,12.531921 10.788174,12.082763 11.322914,11.958224 Z",
              ])}
              {...smilAnimationParams}
            />
            <animateTransform
              ref={p9tAnimRef}
              attributeName="transform"
              type="translate"
              values={smilAnimationValues([
                "0 0",
                "0 0",
                "-0.37676542 -0.47836664",
                "0 0",
                "0 0",
              ])}
              {...smilAnimationParams}
            />
          </path>
        </g>
      </svg>
    </span>
  );
}
