import { Key } from "./key.js";
import { LoadingSlime } from "./loadingSlime.js";

export const buttonStyleDisabled =
  "appearance-none " +
  "m-0.5 h-10 py-1.5 px-2.5 min-w-max text-center content-center " +
  "border border-slate-400 dark:border-stone-600 rounded-lg cursor-default " +
  "bg-slate-400 dark:bg-stone-700 ";
export const buttonStyle =
  "appearance-none " +
  "m-0.5 h-10 py-1.5 px-2.5 min-w-max text-center content-center " +
  "border border-slate-400 dark:border-stone-600 rounded-lg cursor-pointer " +
  "bg-gradient-to-t from-blue-100 to-blue-50 " +
  "hover:from-blue-50 hover:to-white " +
  "active:from-blue-200 active:to-blue-200 " + 
  "dark:from-amber-950 dark:to-amber-900 " +
  "hover:dark:from-amber-900 hover:dark:to-amber-800 " +
  "active:dark:from-amber-975 active:dark:to-amber-975 " + 
  "shadow active:shadow-inner ";

interface Props {
  className?: string;
  onClick?: () => void;
  text?: string;
  keyName?: string | string[];
  disabled?: boolean;
  loading?: boolean;
}
export default function Button(props: Props) {
  return (
    <button
      className={
        (props.disabled || props.loading ? buttonStyleDisabled : buttonStyle) +
        (props.loading ? "cursor-wait " : "") +
        props.className
      }
      onClick={() => props.onClick && props.onClick()}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={props.disabled || props.loading}
    >
      {props.loading && <LoadingSlime />}
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
