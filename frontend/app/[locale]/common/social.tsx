"use client";

import clsx from "clsx/lite";
import { ButtonHighlight } from "./button";
import { XLogo } from "./x";
import { YouTubeLogo } from "./youtubeLogo";
import { useTranslations } from "next-intl";

export function SocialLinks() {
  const t = useTranslations("main.social");

  return (
    <section
      className={clsx(
        "w-full max-w-main",
        "px-3 gap-4 mb-8 main-wide:mb-12",
        "flex flex-col items-center"
      )}
    >
      <h2 className="fn-heading-sect text-3xl">{t("title")}</h2>
      <DiscordInvite />
      <div className="flex flex-col main-wide:flex-row items-center justify-center gap-4">
        <YouTubeBadge />
        <XBadge />
      </div>
    </section>
  );
}

// inspired by https://github.com/SwitchbladeBot/invidget
function DiscordInvite() {
  const t = useTranslations("main.social.discord");
  return (
    <a
      href="/discord"
      target="_blank"
      className={clsx(
        "fn-flat-button fn-selected fn-plain rounded-sq-box",
        "flex flex-col items-center px-8 py-4 gap-2",
        "main-wide:flex-row main-wide:gap-4 main-wide:pl-4 main-wide:pr-6"
      )}
    >
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
      <ButtonHighlight />
      <img
        src={
          process.env.ASSET_PREFIX +
          "/assets/app-icon-any.svg" +
          process.env.ASSET_QUERY_ICON
        }
        className="size-[4rem] rounded-[1rem] border border-gray-400/25"
      />
      <div
        className={clsx(
          "flex flex-col items-center main-wide:items-start",
          "mb-4 main-wide:mb-0 main-wide:mr-8"
        )}
      >
        <div className="font-title font-semibold text-lg fg-bright">Falling Nikochan</div>
        <div className="flex items-center font-title text-sm">
          <span className="w-2 h-2 rounded-full bg-[#3ba55c] mr-1" />
          <span className="mr-2">{t("online", { num: 0 })}</span>
          <span className="w-2 h-2 rounded-full bg-[#747f8d] mr-1" />
          <span>{t("members", { num: 0 })}</span>
        </div>
      </div>
      <button
        className={clsx(
          "z-4", // fn-highlightより前
          "cursor-pointer",
          "px-4 py-2 bg-[#3ba55c] hover:bg-[#2e854b] rounded-lg",
          "text-base font-title font-medium dark fg-bright",
          "transition-colors duration-150"
        )}
      >
        {t("join")}
      </button>
    </a>
  );
}

function YouTubeBadge() {
  return (
    <>
      <a
        href="https://www.youtube.com/@nikochan144"
        target="_blank"
        className="flex items-center group"
      >
        <div className="fn-flat-button fn-social-badge fn-selected fn-plain fn-social-youtube">
          <span className="fn-glass-1" />
          <span className="fn-glass-2" />
          <ButtonHighlight />
          <YouTubeLogo className="text-xl" />
          @nikochan144
        </div>
        <div
          className={clsx(
            "relative px-1 py-1 ml-2 w-max min-w-12",
            "grid-centering rounded-lg border",
            "border-slate-400 dark:border-stone-500",
            "bg-white dark:bg-stone-700",
            "font-title font-medium"
          )}
        >
          <span
            className={clsx(
              "absolute inline-block right-full inset-y-0 my-auto",
              "w-2.5 h-2.5 translate-x-1/2 z-10",
              "border-l border-b rounded-tr-full",
              "rotate-45 origin-center",
              "border-slate-400 dark:border-stone-500",
              "bg-white dark:bg-stone-700"
            )}
          />
          0
        </div>
      </a>
    </>
  );
}
function XBadge() {
  return (
    <a
      href="https://twitter.com/nikochan144"
      target="_blank"
      className="fn-flat-button fn-social-badge fn-selected fn-plain fn-social-x"
    >
      <span className="fn-glass-1" />
      <span className="fn-glass-2" />
      <ButtonHighlight />
      <XLogo className="text-lg" />
      @nikochan144
    </a>
  );
}
