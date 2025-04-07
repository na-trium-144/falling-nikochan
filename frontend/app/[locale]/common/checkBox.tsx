import CheckCorrect from "@icon-park/react/lib/icons/CheckCorrect";
import Square from "@icon-park/react/lib/icons/Square";

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
        "hover:text-slate-500 disabled:text-slate-400 " +
        "hover:dark:text-stone-500 disabled:dark:text-stone-600 " +
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
