"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { linkStyle1 } from "./linkStyle.js";
import { useTranslations } from "next-intl";
import { themeColorDark, themeColorLight } from "@/metadata.js";
import DropDown, { DropDownOption } from "./dropdown";

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
export const defaultThemeStyle = "text-slate-800 dark:text-stone-300";
const applyTheme = () => {
  if (typeof document !== "undefined") {
    document.body.classList.add(
      "bg-gradient-to-t",
      "bg-sky-50",
      "from-sky-50",
      "to-sky-200",
      "dark:bg-orange-950",
      "dark:from-orange-950",
      "dark:to-orange-975",
      ...defaultThemeStyle.split(" ")
    );
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
  applyTheme(); // できるだけ早く、useEffectとかよりも先に実行する
  const updateTheme = () => {
    setTheme(getCurrentTheme());
    const isDark = currentThemeIsDark();
    setIsDark(isDark);
    applyTheme();
  };
  useEffect(() => {
    updateTheme();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", updateTheme);
    const i = setInterval(updateTheme, 1000);
    return () => {
      mql.removeEventListener("change", updateTheme);
      clearInterval(i);
    };
  }, []);
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
      {props.children}
    </ThemeContext.Provider>
  );
}

export function ThemeSwitcher(props: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("footer");

  const options: DropDownOption<string>[] = useMemo(
    () => [
      { value: "dark", label: t("dark") },
      { value: "light", label: t("light") },
      { value: "null", label: t("default") },
    ],
    [t]
  );

  return (
    <DropDown
      options={options}
      onSelect={(value) => {
        if (value === "dark" || value === "light") {
          setTheme(value as "dark" | "light");
        } else {
          setTheme(null);
        }
      }}
    >
      {props.children}
    </DropDown>
  );
}
