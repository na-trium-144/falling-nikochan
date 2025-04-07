import Down from "@icon-park/react/lib/icons/Down";
import { buttonStyle, buttonStyleDisabled } from "./button.js";

interface Props {
  options: string[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
export default function Select(props: Props) {
  return (
    <span className="inline-block relative">
      <select
        className={(props.disabled ? buttonStyleDisabled : buttonStyle) + "pr-6"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      >
        {props.options.map((option, i) => {
          return (
            <option key={i} value={props.values[i]}>
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
