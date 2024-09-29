import { Key } from "./key";

export const buttonStyleDisabled =
  "mx-0.5 py-1.5 px-2.5 border border-gray-600 rounded cursor-pointer " + "bg-gray-500 ";
export const buttonStyle =
  "mx-0.5 py-1.5 px-2.5 border border-gray-600 rounded cursor-pointer " +
  "bg-gradient-to-t from-slate-300 to-slate-50 " +
  "hover:from-slate-200 hover:to-white " +
  "active:from-slate-100 active:to-slate-300 active:shadow-inner ";

interface Props {
  className?: string;
  onClick?: () => void;
  text?: string;
  keyName?: string | string[];
  disabled?: boolean;
}
export default function Button(props: Props) {
  return (
    <button
      className={
        (props.disabled
          ? buttonStyleDisabled
          : buttonStyle) +
        props.className
      }
      onClick={() => props.onClick && props.onClick()}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={props.disabled}
    >
      <span className={props.keyName ? "mr-1" : ""}>{props.text}</span>
      {Array.isArray(props.keyName)
        ? props.keyName.map((k, i) => (
            <>
              {i > 0 && <span className="">+</span>}
              <Key key={i} className="text-xs p-0.5 ">
                {k}
              </Key>
            </>
          ))
        : props.keyName && (
            <Key className="text-xs p-0.5 ">{props.keyName}</Key>
          )}
    </button>
  );
}
