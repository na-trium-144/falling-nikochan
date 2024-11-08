interface KeyProps {
  children: string;
  className?: string;
}
export function Key(props: KeyProps) {
  return (
    <span
      className={
        "border-2 border-black dark:border-stone-400 rounded shadow shadow-slate-400 dark:shadow-stone-700 " +
        "bg-white/75 dark:bg-stone-900/75 " +
        props.className
      }
    >
      {props.children}
    </span>
  );
}
