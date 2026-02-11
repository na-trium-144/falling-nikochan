"use client";

import clsx from "clsx/lite";
import { levelTypes } from "@falling-nikochan/chart";
import { useTranslations } from "next-intl";

export function AboutContent4() {
  const t = useTranslations("about.4");
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          {t.rich("content1", {
            level: (c) => (
              <span
                className={clsx(
                  "inline-block ml-0.5",
                  "fn-level-type",
                  levelTypes[Number(c)]
                )}
              >
                <span>{levelTypes[Number(c)]}-</span>
                <span>{4 + Number(c) * 4}</span>
              </span>
            ),
          })}
        </p>
        <p>
          {t.rich("content2", {
            level: (c) => (
              <span
                className={clsx("mx-1", `fn-level-col-${"sdm"[Number(c)]}`)}
              >
                {levelTypes[Number(c)]}
              </span>
            ),
          })}
        </p>
        <p>{t("content3")}</p>
      </div>
    </>
  );
}
