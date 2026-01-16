"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useMemo } from "react";
import DropDown, { DropDownOption } from "./dropdown";

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
  
  const options: DropDownOption<string>[] = useMemo(
    () =>
      Object.keys(langNames).map((lang) => ({
        value: lang,
        label: langNames[lang],
      })),
    []
  );

  return (
    <DropDown
      options={options}
      onSelect={(value) => {
        document.cookie = `language=${value};path=/;max-age=31536000`;
        if (window.location.pathname.startsWith(`/${props.locale}`)) {
          router.replace(
            window.location.pathname.replace(
              `/${props.locale}`,
              `/${value}`
            ),
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
