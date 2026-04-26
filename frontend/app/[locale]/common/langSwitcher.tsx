"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import DropDown from "./dropdown";
import clsx from "clsx/lite";
import Translate from "@icon-park/react/lib/icons/Translate";
import DownOne from "@icon-park/react/lib/icons/DownOne";

export const langNames: { [key: string]: string } = {
  ja: "日本語",
  en: "English",
};
interface LangProps {
  locale: string;
  children: ReactNode;
  className?: string;
}
export function LangSwitcher(props: LangProps) {
  const router = useRouter();

  return (
    <DropDown
      className={clsx("fn-link-1", props.className)}
      value={props.locale}
      options={Object.keys(langNames).map((lang) => ({
        value: lang,
        label: langNames[lang],
      }))}
      onSelect={(value) => {
        document.cookie = `language=${value};path=/;max-age=31536000`;
        if (window.location.pathname.startsWith(`/${props.locale}`)) {
          router.replace(
            window.location.pathname.replace(`/${props.locale}`, `/${value}`),
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
      {props.children}
    </DropDown>
  );
}

export function MenuLangSwitcher({ locale }: { locale: string }) {
  return (
    <p>
      <Translate className="inline-block align-middle" />
      <span className="ml-1">Language:</span>
      <LangSwitcher
        locale={locale}
        className={clsx(
          "relative inline-block align-top pr-6 text-center",
          "fn-link-1",
          "fn-input"
        )}
      >
        <div>{langNames[locale]}</div>
        <DownOne
          className="absolute right-1 inset-y-0 h-max m-auto"
          theme="filled"
        />
        {Object.values(langNames).map((l) => (
          // 最大幅を取得するため
          <span key={l} className="block h-0 overflow-hidden">
            {l}
          </span>
        ))}
      </LangSwitcher>
    </p>
  );
}
