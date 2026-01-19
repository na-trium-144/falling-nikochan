"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import DropDown from "./dropdown";
import { linkStyle1 } from "./linkStyle";
import clsx from "clsx/lite";

export const langNames: { [key: string]: string } = {
  ja: "日本語",
  en: "English",
};
interface LangProps {
  locale: string;
  children: ReactNode;
  className?: string
}
export function LangSwitcher(props: LangProps) {
  const router = useRouter();

  return (
    <DropDown
      className={clsx(linkStyle1, props.className)}
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
          // /share/cid など
          router.refresh();
        }
      }}
    >
      {props.children}
    </DropDown>
  );
}
