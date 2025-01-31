import { Down } from "@icon-park/react";
import { buttonStyle } from "./button";

interface Props {
  options: string[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
}
export default function Select(props: Props) {
  return (
    <span className="inline-block relative">
      <select
        className={buttonStyle + "pr-6"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
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
        className="absolute inset-y-0 my-auto h-max right-2 cursor-pointer "
        theme="filled"
      />
    </span>
  );
}
