import { Key } from "../messageBox";

interface Props {
  onClick?: () => void;
  text?: string;
  keyName?: string;
  disabled?: boolean;
}
export default function Button(props: Props) {
  return (
    <button
      className={
        "mx-0.5 p-1 border border-gray-600 rounded " +
        (props.disabled
          ? "bg-gray-500 "
          : "bg-gray-200 hover:bg-gray-100 active:bg-gray-300 active:shadow-inner")
      }
      onClick={() => props.onClick && props.onClick()}
      onKeyDown={(e) => e.stopPropagation()}
      disabled={props.disabled}
    >
      <span>{props.text}</span>
      {props.keyName && (
        <Key className={"text-xs p-0.5 " + (props.text ? "ml-1 " : "")}>
          {props.keyName}
        </Key>
      )}
    </button>
  );
}
