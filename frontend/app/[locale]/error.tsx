"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";
import { CenterBox } from "@/common/box";
import clsx from "clsx/lite";
import { GoHomeButton, LinksOnError } from "./common/errorPageComponent";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ClientErrorPage(props: ErrorProps) {
  const t = useTranslations("error.errorPage");
  return (
    <CenterBox scrollableY>
      <h4 className="mb-2 text-lg font-semibold font-title">{t("title")}</h4>
      {props.error && (
        <pre
          className={clsx(
            "mb-3",
            "p-2 rounded-md",
            "overflow-x-auto text-xs",
            "bg-sky-200/25 dark:bg-orange-800/10"
          )}
        >
          {String(props.error)}
        </pre>
      )}
      <LinksOnError />
      <GoHomeButton />
    </CenterBox>
  );
}
