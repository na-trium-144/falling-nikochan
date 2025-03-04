import Link from "next/link";

export const pagerButtonClass =
  "text-center inline-block w-7 h-7 rounded-full cursor-pointer " +
  "text-lg text-bold hover:bg-slate-200 active:bg-slate-300 " +
  "hover:dark:bg-stone-700 active:dark:bg-stone-600 ";
interface Props {
  index: number;
  maxIndex: number;
  title: string;
  hrefBefore?: string;
  onClickBefore?: () => void;
  hrefAfter?: string;
  onClickAfter?: () => void;
}
export function Pager(props: Props) {
  return (
    <div
      className={
        "flex flex-col main-wide:flex-row items-center mb-4 " +
        "space-y-2 main-wide:space-y-0 main-wide:space-x-2 "
      }
    >
      <div>
        {props.index > 1 ? (
          props.hrefBefore ? (
            <Link
              className={pagerButtonClass}
              href={props.hrefBefore}
              scroll={false}
              replace
              prefetch={false}
            >
              &lt;
            </Link>
          ) : (
            <button className={pagerButtonClass} onClick={props.onClickBefore}>
              &lt;
            </button>
          )
        ) : (
          <span className="inline-block w-7" />
        )}
        <span className="inline-block">
          <span className="inline-block w-6 text-right">{props.index}</span>
          <span className="mx-2">/</span>
          <span className="inline-block w-6 text-left">{props.maxIndex}</span>
        </span>
        {props.index < props.maxIndex ? (
          props.hrefAfter ? (
            <Link
              className={pagerButtonClass}
              href={props.hrefAfter}
              scroll={false}
              replace
              prefetch={false}
            >
              &gt;
            </Link>
          ) : (
            <button className={pagerButtonClass} onClick={props.onClickAfter}>
              &gt;
            </button>
          )
        ) : (
          <span className="inline-block w-7" />
        )}
      </div>
      <div className="flex-1">
        <span className="inline-block text-xl font-bold font-title ">
          {props.title}
        </span>
      </div>
    </div>
  );
}
