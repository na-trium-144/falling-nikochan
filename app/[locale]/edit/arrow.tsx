/*
使い方:
  <div className="absolute">
    <Arrow
      topまたはbottom={先端座標}
      leftまたはright={先端座標}
      length={length}
      rotation={radian(時計回り), 0= ←}
    />
  </div>
*/
interface Props {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  length: number;
  lineWidth: number;
  rotation: number;
}
export default function Arrow(props: Props) {
  return (
    <div
      className="absolute left-0 origin-left "
      style={{
        top: props.top !== undefined ? props.top - props.lineWidth : undefined,
        bottom:
          props.bottom !== undefined
            ? props.bottom - props.lineWidth
            : undefined,
        left: props.left !== undefined ? props.left : undefined,
        right:
          props.right !== undefined ? props.right + props.length : undefined,
        height: props.lineWidth * 2,
        width: props.length,
        transform: `rotate(${props.rotation}rad)`,
      }}
    >
      <div
        className="absolute w-0 h-0 border-amber-300"
        style={{
          top: 0,
          left: -props.lineWidth,
          borderWidth: props.lineWidth,
          borderLeftColor: "transparent",
          borderTopColor: "transparent",
          borderBottomColor: "transparent",
        }}
      />
      <div
        className="absolute bg-amber-300"
        style={{
          left: (props.lineWidth * 3) / 4,
          top: props.lineWidth / 2,
          height: props.lineWidth,
          width: props.length - (props.lineWidth * 3) / 4,
        }}
      />
    </div>
  );
}
