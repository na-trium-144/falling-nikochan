"use client";
import { CenterBox } from "@/common/box";
import clsx from "clsx/lite";

// Error boundaries must be Client Components

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function Error(props: ErrorProps) {
  // ここに到達するのは error.tsx のレンダリングですらエラーになった場合。
  // ボタンとかは置いても無駄でしょう
  return (
    <html>
      <body
        className={clsx(
          "w-full h-dvh overflow-hidden touch-none",
          // ThemeProviderのimportも避けて直接書いている。
          // TODO: theme.tsx で変数として定義してimport
          "bg-gradient-to-t",
          "bg-sky-50",
          "from-sky-50",
          "to-sky-200",
          "dark:bg-orange-950",
          "dark:from-orange-950",
          "dark:to-orange-975",
          "text-default",
          "dark:text-default-dark"
        )}
      >
        <CenterBox>
          <h4 className="mb-2 text-lg font-semibold font-title">
            An error has occurred 😢
          </h4>
          {props.error ? (
            <pre
              className={clsx(
                "p-2 rounded-md",
                "overflow-x-auto text-xs",
                "bg-sky-200/25 dark:bg-orange-800/10"
              )}
            >
              {String(props.error)}
            </pre>
          ) : (
            <div>See the browser console for more information.</div>
          )}
        </CenterBox>
      </body>
    </html>
  );
}
