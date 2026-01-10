import clsx from "clsx/lite";
import Down from "@icon-park/react/lib/icons/Down";
// import { buttonStyle, buttonStyleDisabled } from "./button.js";

interface Props {
  options: string[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  disableFirstOption?: boolean;
  classNameOuter?: string;
  classNameInner?: string;
}
export default function Select(props: Props) {
  return (
    <span className={clsx("inline-block relative", props.classNameOuter)}>
      <select
        className={clsx(
          // props.disabled ? buttonStyleDisabled : buttonStyle,
          "pr-6",
          props.classNameInner
        )}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      >
        {props.options.map((option, i) => {
          return (
            <option
              key={i}
              value={props.values[i]}
              hidden={props.disableFirstOption && i === 0}
              disabled={props.disableFirstOption && i === 0}
            >
              {option}
            </option>
          );
        })}
      </select>
      <Down
        className="absolute inset-y-0 my-auto h-max right-2 cursor-pointer pointer-events-none "
        theme="filled"
      />
    </span>
  );
}
