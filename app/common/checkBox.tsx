import { CheckCorrect, Square } from "@icon-park/react";

interface Props {
  children: React.ReactNode;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}
export default function CheckBox(props: Props) {
  return (
    <button
      className={
        "ml-2 " +
        "hover:text-slate-500 disabled:text-slate-400 " +
        "hover:dark:text-stone-400 disabled:text-stone-700 " +
        props.className
      }
      onClick={() => props.onChange(!props.value)}
      disabled={props.disabled}
    >
      <span className="inline-block w-5 translate-y-0.5">
        {props.value ? <CheckCorrect /> : <Square />}
      </span>
      {props.children}
    </button>
  );
}
