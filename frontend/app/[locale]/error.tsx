"use client"; // Error boundaries must be Client Components

import { useTranslations } from "next-intl";
import { CenterBox } from "@/common/box";
import {
  ErrorMessage,
  GoHomeButton,
  LinksOnError,
} from "./common/errorPageComponent";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ClientErrorPage(props: ErrorProps) {
  const t = useTranslations("error.errorPage");
  return (
    <CenterBox scrollableY>
      <h4 className="mb-2 text-lg font-semibold font-title">{t("title")}</h4>
      <ErrorMessage className="mb-3" error={props.error} />
      <LinksOnError />
      <GoHomeButton />
    </CenterBox>
  );
}
