"use client";

import clsx from "clsx/lite";
import { Box } from "@/common/box.js";
import { linkStyle3 } from "@/common/linkStyle";
import { SmallDomainShare } from "@/common/small";
import TargetLine from "@/common/targetLine.js";
import { useDisplayMode } from "@/scale.js";
import Youtube from "@icon-park/react/lib/icons/Youtube.js";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function AboutContent3({ locale }: { locale: string }) {
  const t = useTranslations("about.3");
  const { screenWidth, rem, isMobileMain } = useDisplayMode();

  return (
    <>
      <div
        className={clsx(
          "flex flex-row space-x-2 mb-4 items-center",
          "main-wide:flex-col main-wide:space-x-0 main-wide:space-y-2",
          "main-wide:mb-4"
        )}
      >
        <div className="flex-1 space-y-2 text-center">
          <p>{t("content1")}</p>
          <p>
            {t.rich("content2", {
              youtube: (c) => (
                <span className="relative inline-block">
                  <Youtube
                    className="absolute left-0.5 bottom-1"
                    theme="filled"
                  />
                  <span className="ml-5 mr-1">{c}</span>
                </span>
              ),
            })}
          </p>
          <p>
            {t.rich("content3", {
              small: (c) => <span className="text-sm">{c}</span>,
              linkPolicies: (c) => (
                <Link
                  href={`/${locale}/main/policies`}
                  className={clsx(linkStyle3)}
                  prefetch={!process.env.NO_PREFETCH}
                >
                  {c}
                </Link>
              ),
            })}
          </p>
        </div>
        {screenWidth >= 25 * rem && (
          <Box
            classNameOuter={clsx(
              "rounded-none! relative",
              "basis-1/3 shrink max-w-32 h-48",
              "main-wide:basis-auto main-wide:shrink-0 main-wide:max-w-56 main-wide:w-56 main-wide:h-24"
            )}
          >
            <div
              className={clsx(
                "absolute bg-amber-600 rounded-sm m-1",
                "top-0 inset-x-0 p-1 pl-10 h-12",
                "main-wide:left-auto main-wide:pl-1 main-wide:pb-3 main-wide:w-20 main-wide:h-14"
              )}
            >
              <div className="bg-black w-full h-full text-center flex items-center justify-center">
                <Youtube
                  className="inline-block w-max text-red-600 text-4xl"
                  theme="filled"
                />
              </div>
            </div>
            <TargetLine left={0} right={0} bottom={isMobileMain ? 30 : 15} />
            <div
              className="absolute "
              style={{
                width: 20,
                height: 20,
                left: 40,
                bottom: isMobileMain ? 35 : 20,
              }}
            >
              <img
                src={process.env.ASSET_PREFIX + `/assets/nikochan0.svg`}
                className="w-full h-full "
              />
            </div>
            <div
              className="absolute "
              style={{
                width: 20,
                height: 20,
                left: 70,
                bottom: isMobileMain ? 70 : 55,
              }}
            >
              <img
                src={process.env.ASSET_PREFIX + `/assets/nikochan0.svg`}
                className="w-full h-full "
              />
            </div>
          </Box>
        )}
      </div>
      <div className="mb-4 space-y-2 text-center">
        <p>{t("content4")}</p>
        <p>
          {t.rich("content5", {
            url: () => <SmallDomainShare />,
          })}
        </p>
      </div>
    </>
  );
}
