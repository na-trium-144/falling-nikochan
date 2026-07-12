"use client";

import clsx from "clsx/lite";
import { ButtonHighlight } from "./button";
import { XLogo } from "./x";
import { YouTubeLogo } from "./youtubeLogo";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import * as v from "valibot";
import { fetchBackend } from "./fetch";

const SocialDataSchema = () =>
  v.object({
    discord: v.object({
      member: v.number(),
      online: v.number(),
    }),
    youtube: v.object({
      subscribers: v.number(),
    }),
  });
type SocialData = v.InferOutput<ReturnType<typeof SocialDataSchema>>;

// discord招待リンクをハードコードしている場所は、ここと route/src/api/social.ts の2箇所ある
export const discordInviteUrl = "https://discord.gg/BGQ6Vk9maA";

export function SocialLinks() {
  const t = useTranslations("main.social");
  const [socialData, setSocialData] = useState<SocialData>();

  useEffect(() => {
    fetchBackend()
      .get("/api/social")
      .json((json) => setSocialData(v.parse(SocialDataSchema(), json)));
  }, []);

  return (
    <section
      className={clsx(
        "w-full max-w-main",
        "px-3 gap-4 mb-8 main-wide:mb-12",
        "flex flex-col items-center"
      )}
    >
      <h2 className="fn-heading-sect text-3xl">{t("title")}</h2>
      <DiscordInvite socialData={socialData} />
      <div className="flex flex-col main-wide:flex-row items-center justify-center gap-4">
        <YouTubeBadge socialData={socialData} />
        <XBadge />
      </div>
    </section>
  );
}

// inspired by https://github.com/SwitchbladeBot/invidget
function DiscordInvite(props: { socialData?: SocialData }) {
  const t = useTranslations("main.social.discord");
  return (
    <a
      href={discordInviteUrl}
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
        // 背景とアイコンが近い色なためborderがないと見づらい
        className="size-[4rem] rounded-[1rem] border border-gray-400/25"
      />
      <div
        className={clsx(
          "flex flex-col items-center main-wide:items-start",
          "mb-4 main-wide:mb-0 main-wide:mr-8"
        )}
      >
        <div className="font-title font-semibold text-lg fg-bright">
          Falling Nikochan
        </div>
        <div className="flex items-center font-title text-sm">
          <span className="w-2 h-2 rounded-full bg-discord-online mr-1" />
          <span className="mr-2">
            {t("online", { num: props.socialData?.discord.online ?? "-" })}
          </span>
          <span className="w-2 h-2 rounded-full bg-discord-members mr-1" />
          <span>
            {t("members", { num: props.socialData?.discord.member ?? "-" })}
          </span>
        </div>
      </div>
      <button
        className={clsx(
          "z-4", // fn-highlightより前
          "cursor-pointer",
          "px-4 py-2 bg-discord-joinButtonBackground hover:bg-discord-joinButtonHovered rounded-lg",
          "text-base font-title font-medium dark fg-bright",
          "transition-colors duration-150"
        )}
      >
        {t("join")}
      </button>
    </a>
  );
}

function YouTubeBadge(props: { socialData?: SocialData }) {
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
          {props.socialData?.youtube.subscribers ?? "-"}
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
