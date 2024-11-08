"use client";

import { useEffect, useState } from "react";
import { linkStyle1 } from "./linkStyle";
import { Moon, Sun } from "@icon-park/react";

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
    document.body.classList.add(
      "bg-gradient-to-t",
      "from-sky-50",
      "to-sky-200",
      "text-black",
      "dark:from-orange-800",
      "dark:to-orange-950",
      "dark:text-white"
    );
    if (currentThemeIsDark()) {
      /* ダークテーマの時 */
      document.body.classList.add("dark");
    } else {
      /* ライトテーマの時 */
      document.body.classList.remove("dark");
    }
  }
};
export interface ThemeContext {
  theme: "dark" | "light" | null;
  isDark: boolean;
  setTheme: (theme: "dark" | "light" | null) => void;
}
// setTheme 時に他のインスタンスに変更を通知する手段がないので、
// ページ内の1箇所のみで使用すること
export function useTheme(): ThemeContext {
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
    return () => mql.removeEventListener("change", updateTheme);
  }, []);
  return {
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
  };
}

// switcherは不要だけどサーバーサイドでテーマを処理したい時に使う
export function ThemeHandler() {
  const themeContext = useTheme();
  return null;
}

export function ThemeSwitcher(props: ThemeContext) {
  const { isDark, theme, setTheme } = props;

  return (
    <span className={"inline-block relative " + linkStyle1}>
      <select
        className="absolute inset-0 opacity-0 z-10 cursor-pointer appearance-none "
        value={String(theme)}
        onChange={(e) => {
          if (e.target.value === "dark" || e.target.value === "light") {
            setTheme(e.target.value as "dark" | "light");
          } else {
            setTheme(null);
          }
        }}
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="null">System Default</option>
      </select>
      {isDark ? (
        <Moon className="absolute bottom-1 left-0 " />
      ) : (
        <Sun className="absolute bottom-1 left-0 " />
      )}
      <span className="ml-5 ">Theme</span>
    </span>
  );
}
