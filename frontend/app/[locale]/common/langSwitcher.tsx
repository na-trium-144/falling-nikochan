"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { linkStyle1 } from "./linkStyle";

export const langNames: { [key: string]: string } = {
  ja: "日本語",
  en: "English",
};
interface LangProps {
  locale: string;
  children: ReactNode;
}
export function LangSwitcher(props: LangProps) {
  const router = useRouter();
  return (
    <span className={"inline-block relative " + linkStyle1}>
      <select
        className="absolute text-center inset-0 opacity-0 z-10 cursor-pointer appearance-none "
        value={props.locale}
        onChange={(e) => {
          document.cookie = `language=${e.target.value};path=/;max-age=31536000`;
          if (window.location.pathname.startsWith(`/${props.locale}`)) {
            router.replace(
              window.location.pathname.replace(
                `/${props.locale}`,
                `/${e.target.value}`
              ),
              { scroll: false }
            );
          } else {
            // /share/cid など
            router.refresh();
          }
        }}
      >
        {Object.keys(langNames).map((lang) => (
          <option key={lang} value={lang}>
            {langNames[lang]}
          </option>
        ))}
      </select>
      {props.children}
    </span>
  );
}
