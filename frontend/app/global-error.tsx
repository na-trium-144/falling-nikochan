"use client";
import { CenterBox } from "@/common/box";
import { ErrorMessage } from "@/common/errorPageComponent";
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
          "fn-csr-ready"
        )}
      >
        <div className="fn-fallback-bg" />
        <CenterBox>
          <h4 className="fn-heading-box">An error has occurred 😢</h4>
          <ErrorMessage error={props.error} />
        </CenterBox>
      </body>
    </html>
  );
}
