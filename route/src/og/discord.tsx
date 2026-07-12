import React from "react";
import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import {
  discordBackground,
  discordBackgroundDark,
  discordJoinButtonBackground,
  discordJoinButtonText,
  discordMembers,
  discordOnline,
  discordPresenceText,
  discordPresenceTextDark,
  discordServerName,
  discordServerNameDark,
  flexCol,
  flexRow,
  fontTitle,
} from "./style.js";
import type { discordMembers as socialDiscordMembers } from "../api/social.js";

// common/social.tsx とだいたいあわせる (ちょっとレイアウトが違う)
// サイズをem単位で common/social.tsx や公式とほぼ同じにし、全体のfontSizeを調整することでサイズを変える
export async function DiscordInvite(
  lang: string,
  theme: string,
  appIconBin: Promise<string>,
  data: ReturnType<typeof socialDiscordMembers>
) {
  const t = await getTranslations(lang, "main.social.discord");
  return (
    <div
      style={{
        ...flexCol,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        fontSize: 64,
        gap: "1em",
        background:
          theme === "light" ? discordBackground : discordBackgroundDark,
      }}
    >
      <div
        style={{
          ...flexRow,
          alignItems: "center",
          gap: "1em",
        }}
      >
        <img
          src={`data:image/png;base64,${btoa(await appIconBin)}`}
          style={{
            width: "4em",
            height: "4em",
            borderRadius: "1em",
            border: "0.0625em solid #99a1af40", // gray-400/25
          }}
        />
        <div
          style={{
            ...flexCol,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              color:
                theme === "light" ? discordServerName : discordServerNameDark,
              fontFamily: fontTitle,
              fontWeight: 600,
              // text-lg
              fontSize: "1.125em",
              lineHeight: 1.75 / 1.125,
            }}
          >
            Falling Nikochan
          </div>
          <div
            style={{
              ...flexRow,
              alignItems: "center",
              color:
                theme === "light"
                  ? discordPresenceText
                  : discordPresenceTextDark,
              fontFamily: fontTitle,
              fontWeight: 400,
              // text-sm
              fontSize: "0.875em",
              lineHeight: 1.25 / 0.875,
            }}
          >
            <span
              style={{
                width: "0.571em", // 0.5rem /  0.875
                height: "0.571em",
                borderRadius: "100%",
                background: discordOnline,
                marginRight: "0.286em", // 0.25rem / 0.875
              }}
            />
            <span
              style={{
                marginRight: "0.571em",
              }}
            >
              {t("online", { num: (await data).online })}
            </span>
            <span
              style={{
                width: "0.571em", // 0.5rem /  0.875
                height: "0.571em",
                borderRadius: "100%",
                background: discordMembers,
                marginRight: "0.286em", // 0.25rem / 0.875
              }}
            />
            <span>{t("members", { num: (await data).member })}</span>
          </div>
        </div>
      </div>
      <button
        style={{
          padding: "0.5em 1em",
          borderRadius: "0.5em",
          background: discordJoinButtonBackground,
          color: discordJoinButtonText,
          fontFamily: fontTitle,
          fontWeight: 500,
        }}
      >
        {t("join")}
      </button>
    </div>
  );
}
