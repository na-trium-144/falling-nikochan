"use client";

import clsx from "clsx/lite";
import { levelTypes } from "@falling-nikochan/chart";
import { levelColors } from "@/common/levelColors";
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
                className={clsx("inline-block ml-0.5", levelColors[Number(c)])}
              >
                <span className="text-sm">{levelTypes[Number(c)]}-</span>
                <span className="">{4 + Number(c) * 4}</span>
              </span>
            ),
          })}
        </p>
        <p>
          {t.rich("content2", {
            level: (c) => (
              <span className={clsx("mx-1", levelColors[Number(c)])}>
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
