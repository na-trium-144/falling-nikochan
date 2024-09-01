import { Key } from "../messageBox";

interface Props {
  onClick?: () => void;
  text?: string;
  keyName?: string;
}
export default function Button(props: Props) {
  return <button
    className={
      "bg-gray-200 mx-0.5 p-1 border border-gray-600 rounded " +
      "hover:bg-gray-100 active:bg-gray-300 active:shadow-inner"
    }
    onClick={() => props.onClick && props.onClick()}
  >
    <span>{props.text}</span>
    {props.keyName && <Key className="text-xs ml-1 p-0.5">{props.keyName}</Key>}
  </button>;
}
