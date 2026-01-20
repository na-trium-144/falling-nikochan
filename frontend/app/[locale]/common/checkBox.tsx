import clsx from "clsx/lite";
import { Checkbox } from "pretty-checkbox-react";
import { useTheme } from "./theme";
// import "pretty-checkbox";
// import "pretty-checkbox/src/pretty-checkbox.scss";
import "@/styles/checkbox.scss";

interface Props {
  // idは使わないが、指定しないとpretty-checkboxがランダムなUUIDを割り当ててhydration errorしてしまうので、
  // 一意な何かを指定すること
  id: string;
  children: React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}
export default function CheckBox(props: Props) {
  const { isDark } = useTheme();
  return (
    <Checkbox
      id={props.id}
      shape="curve"
      animation="smooth"
      color={isDark ? "danger-o" : "primary-o"}
      className={clsx(
        !props.disabled && "hover:text-slate-500 hover:dark:text-stone-500",
        props.disabled && "[&_label]:line-through",
        // 複数行のlabelを許可
        "[&_label]:text-wrap",
        // labelが複数行になる場合にチェックボックスの位置がバグるのをでっちあげ修正
        // (元々の指定は top: calc(0% - (100% - 1em) - 8%))
        "[&_svg]:top-[-0.08em]! [&_label::before]:top-[-0.08em]! [&_label::after]:top-[-0.08em]!",
        props.className
      )}
      icon={
        <svg className="svg svg-icon" viewBox="0 0 20 20">
          <path
            d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z"
            style={{ stroke: "currentColor", fill: "currentColor" }}
          ></path>
        </svg>
      }
      onChange={() => props.onChange(!props.value)}
      disabled={props.disabled}
      checked={props.value}
    >
      {props.children}
    </Checkbox>
  );
}
