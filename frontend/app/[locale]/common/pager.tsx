import clsx from "clsx/lite";
import Link from "next/link";

// Export CSS class name for compatibility
export const pagerButtonClass = "fn-pager-button";
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
      className={clsx(
        "flex flex-col main-wide:flex-row items-center mb-4",
        "space-y-2 main-wide:space-y-0 main-wide:space-x-2"
      )}
    >
      <div>
        {props.index > 1 ? (
          props.hrefBefore ? (
            <Link
              className={clsx(pagerButtonClass)}
              href={props.hrefBefore}
              scroll={false}
              replace
              prefetch={!process.env.NO_PREFETCH}
            >
              &lt;
            </Link>
          ) : (
            <button
              className={clsx(pagerButtonClass)}
              onClick={props.onClickBefore}
            >
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
              className={clsx(pagerButtonClass)}
              href={props.hrefAfter}
              scroll={false}
              replace
              prefetch={!process.env.NO_PREFETCH}
            >
              &gt;
            </Link>
          ) : (
            <button
              className={clsx(pagerButtonClass)}
              onClick={props.onClickAfter}
            >
              &gt;
            </button>
          )
        ) : (
          <span className="inline-block w-7" />
        )}
      </div>
      <div className="flex-1">
        <span className="inline-block text-xl font-semibold font-title ">
          {props.title}
        </span>
      </div>
    </div>
  );
}
