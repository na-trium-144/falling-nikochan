import { buttonStyle } from "./button";

interface Props {
  options: string[];
  values: string[];
  value: string;
  onChange: (value: string) => void;
}
export default function Select(props: Props) {
  console.log(props.value)
  return (
    <select
      className={buttonStyle + " text-center"}
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
  );
}
