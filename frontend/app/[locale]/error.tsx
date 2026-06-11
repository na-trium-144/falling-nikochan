"use client"; // Error boundaries must be Client Components

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
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
  const [eventId, setEventId] = useState<string>();
  useEffect(() => {
    setEventId(
      Sentry.captureException(props.error, { extra: { captured: "error.tsx" } })
    );
  }, [props.error]);
  return (
    <CenterBox scrollableY classNameInner="flex flex-col items-center">
      <h4 className="fn-heading-box">{t("title")}</h4>
      <ErrorMessage error={props.error} eventId={eventId} />
      <LinksOnError />
      <GoHomeButton />
    </CenterBox>
  );
}
