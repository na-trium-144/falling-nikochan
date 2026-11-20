"use client";

import { useTranslations } from "@/intlProvider";
import clsx from "clsx/lite";
import { ButtonHighlight } from "@/common/button";
import { Box, WarningBox } from "./box";
import { useEffect, useState } from "react";
import { ContactFormLink, GitHubLink, XLink } from "@/common/contactLinks";
import * as v from "valibot";

export function GoHomeButton() {
  const t = useTranslations("error.errorPage");

  return (
    <div>
      <a href="/" className="fn-button">
        <span className="fn-glass-1" />
        <span className="fn-glass-2" />
        <ButtonHighlight />
        {t("goHome")}
      </a>
    </div>
  );
}

export function LinksOnError({
  dependOnStatus,
  error,
  eventId,
}: {
  dependOnStatus?: string | number;
  error?: unknown;
  eventId?: string;
}) {
  const tl = useTranslations("main.links");
  const [isServerSideError, setIsServerSideError] = useState(false);

  useEffect(() => {
    setIsServerSideError(
      Number(dependOnStatus) === 403 || Number(dependOnStatus) >= 500
    );
  }, [dependOnStatus]);

  if (dependOnStatus !== undefined && !isServerSideError) {
    return null;
  }

  return (
    <Box classNameOuter="mb-3" padding={3}>
      <h4 className="fn-heading-box">{tl("contactLinks")}</h4>
      <ul className="list-disc ml-6 space-y-1 text-left">
        <li>
          <ContactFormLink error={error} eventId={eventId} />
        </li>
        <li>
          <XLink />
        </li>
        <li>
          <GitHubLink />
        </li>
      </ul>
    </Box>
  );
}

export function ClientErrorTitle() {
  const t = useTranslations("error.errorPage");
  return <h4 className="fn-heading-box">{t("title")}</h4>;
}

export function ErrorMessage({
  error,
  eventId,
}: {
  error: unknown;
  eventId?: string;
}) {
  const t = useTranslations("error.errorPage");
  const flattenedIssues = v.isValiError(error) ? v.flatten(error.issues) : null;
  if (error) {
    return (
      <>
        <pre
          className={clsx(
            "relative fn-sky fn-pre",
            "mb-3 p-2 rounded-sq-xl text-xs",
            "whitespace-pre-wrap"
          )}
        >
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          {flattenedIssues ? (
            <ul>
              {flattenedIssues?.root && (
                <li>root: {flattenedIssues.root.join(", ")}</li>
              )}
              {flattenedIssues?.nested &&
                Object.entries(flattenedIssues.nested).map(([key, issues]) => (
                  <li key={key}>
                    {key}: {issues?.join(", ")}
                  </li>
                ))}
              {flattenedIssues?.other && (
                <li>other: {flattenedIssues.other.join(", ")}</li>
              )}
            </ul>
          ) : (
            String(error)
          )}
          {eventId && <div className="text-dim mt-1">EventID={eventId}</div>}
        </pre>
        {error instanceof DOMException && error.name === "NotFoundError" && (
          <WarningBox classNameOuter="mb-3">
            {t("disableTranslation")}
          </WarningBox>
        )}
      </>
    );
  } else {
    return <div>See the browser console for more information.</div>;
  }
}
