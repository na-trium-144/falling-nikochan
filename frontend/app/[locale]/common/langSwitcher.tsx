"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import DropDown from "./dropdown";
import clsx from "clsx/lite";
import Translate from "@icon-park/react/lib/icons/Translate";
import DownOne from "@icon-park/react/lib/icons/DownOne";
import { SmallSelect } from "./select";

export const langNames: { [key: string]: string } = {
  ja: "日本語",
  en: "English",
};

export function MenuLangSwitcher({ locale }: { locale: string }) {
  const router = useRouter();
  return (
    <p>
      <Translate className="inline-block align-middle" />
      <span className="ml-1">Language:</span>
      <SmallSelect
        classNameInner="flex-col"
        value={locale}
        options={Object.keys(langNames).map((lang) => ({
          value: lang,
          label: langNames[lang],
        }))}
        onSelect={(value) => {
          document.cookie = `language=${value};path=/;max-age=31536000`;
          if (window.location.pathname.startsWith(`/${locale}`)) {
            router.replace(
              window.location.pathname.replace(`/${locale}`, `/${value}`),
              { scroll: false }
            );
          } else {
            // /share/cid の場合。
            // router.refresh(); は /share/placeholder に飛ぶのでダメ。
            // クエリパラメータのlangを消したurlに遷移
            window.location.replace(window.location.pathname);
          }
        }}
      >
        <div>{langNames[locale]}</div>
        {Object.values(langNames).map((l) => (
          // 最大幅を取得するため
          <span key={l} className="block h-0 overflow-hidden">
            {l}
          </span>
        ))}
      </SmallSelect>
    </p>
  );
}
