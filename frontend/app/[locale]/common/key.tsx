import { ReactNode } from "react";

interface KeyProps {
  children: ReactNode;
  className?: string;
}
export function Key(props: KeyProps) {
  return (
    <span
      className={
        "border-2 border-slate-800 dark:border-stone-300 rounded shadow shadow-slate-400 dark:shadow-stone-700 " +
        "bg-white/75 dark:bg-stone-800/75 " +
        props.className
      }
    >
      {props.children}
    </span>
  );
}
