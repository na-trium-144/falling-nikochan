"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { linkStyle1 } from "./linkStyle.js";
import { useTranslations } from "next-intl";
import { themeColorDark, themeColorLight } from "@/metadata.js";
import DropDown from "./dropdown";
import { IrasutoyaLikeBg } from "./irasutoyaLike.jsx";

export interface ThemeState {
  theme: "dark" | "light" | null;
  isDark: boolean;
  setTheme: (theme: "dark" | "light" | null) => void;
}
const ThemeContext = createContext<ThemeState>({
  theme: null,
  isDark: false,
  setTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

function getCurrentTheme(): "dark" | "light" | null {
  const theme = localStorage?.getItem("theme");
  return theme === "dark" || theme === "light" ? theme : null;
}
function currentThemeIsDark() {
  switch (getCurrentTheme()) {
    case "dark":
      return true;
    case "light":
      return false;
    default:
      return (
        window?.matchMedia("(prefers-color-scheme: dark)").matches || false
      );
  }
}
const applyTheme = () => {
  if (typeof document !== "undefined") {
    document.body.classList.add("fn-csr-ready");
    if (currentThemeIsDark()) {
      /* ダークテーマの時 */
      document.body.classList.add("dark");
    } else {
      /* ライトテーマの時 */
      document.body.classList.remove("dark");
    }
    const metaThemeColor = document.querySelectorAll("meta[name=theme-color]");
    switch (getCurrentTheme()) {
      case "dark":
        metaThemeColor.forEach((e) => {
          e.setAttribute("content", themeColorDark);
        });
        break;
      case "light":
        metaThemeColor.forEach((e) => {
          e.setAttribute("content", themeColorLight);
        });
        break;
      default:
        metaThemeColor[0].setAttribute("content", themeColorLight);
        metaThemeColor[1].setAttribute("content", themeColorDark);
        break;
    }
  }
};

export function ThemeProvider(props: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const updateTheme = useCallback(() => {
    setTheme(getCurrentTheme());
    const isDark = currentThemeIsDark();
    setIsDark(isDark);
    applyTheme();
  }, []);
  useLayoutEffect(() => {
    updateTheme();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", updateTheme);
    const i = setInterval(updateTheme, 1000);
    return () => {
      mql.removeEventListener("change", updateTheme);
      clearInterval(i);
    };
  }, [updateTheme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme: (theme: "dark" | "light" | null) => {
          if (theme !== null) {
            localStorage?.setItem("theme", theme);
          } else {
            localStorage?.removeItem("theme");
          }
          updateTheme();
        },
      }}
    >
      <div className="fn-fallback-bg" />
      <IrasutoyaLikeBg />
      {props.children}
    </ThemeContext.Provider>
  );
}

export function ThemeSwitcher(props: {
  children: ReactNode;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("footer");

  return (
    <DropDown
      className={clsx(linkStyle1, props.className)}
      value={theme}
      options={[
        { value: "dark" as const, label: t("dark") },
        { value: "light" as const, label: t("light") },
        { value: null, label: t("default") },
      ]}
      onSelect={(value) => {
        if (value === "dark" || value === "light") {
          setTheme(value);
        } else {
          setTheme(null);
        }
      }}
    >
      {props.children}
    </DropDown>
  );
}
