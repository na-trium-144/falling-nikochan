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
      <h4 className="fn-heading-box">{t("title")}</h4>
      <ErrorMessage error={props.error} />
      <LinksOnError />
      <GoHomeButton />
    </CenterBox>
  );
}
