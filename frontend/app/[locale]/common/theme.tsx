"use client";

import clsx from "clsx/lite";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import DropDown from "./dropdown";
import { IrasutoyaLikeBg } from "./irasutoyaLike.jsx";
import Moon from "@icon-park/react/lib/icons/Moon";
import Sun from "@icon-park/react/lib/icons/Sun";
import DownOne from "@icon-park/react/lib/icons/DownOne";
import themeInitScript from "./themeInit.js?raw";
import { usePathname } from "next/navigation";

declare global {
  var fnGetCurrentTheme: () => "dark" | "light" | null;
  var fnCurrentThemeIsDark: () => boolean;
  var fnApplyTheme: () => void;
}

export interface ThemeState {
  theme: "dark" | "light" | null;
  isDark: boolean;
  setTheme: (theme: "dark" | "light" | null) => void;
  updateTheme: () => void;
}
const ThemeContext = createContext<ThemeState>({
  theme: null,
  isDark: false,
  setTheme: () => {},
  updateTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider(props: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const pathname = usePathname();
  const updateTheme = useCallback(() => {
    setTheme(window.fnGetCurrentTheme());
    const isDark = window.fnCurrentThemeIsDark();
    setIsDark(isDark);
    window.fnApplyTheme();
  }, []);
  useLayoutEffect(() => {
    updateTheme();
    const storageUpdate = (e: StorageEvent) => {
      if (e.key === "theme") {
        updateTheme();
      }
    };
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", updateTheme);
    window.addEventListener("storage", storageUpdate);
    window.addEventListener("visibilitychange", updateTheme); // 別タブからもどってきたとき
    window.addEventListener("popstate", updateTheme); // router.push()からもどってきたとき
    return () => {
      mql.removeEventListener("change", updateTheme);
      window.removeEventListener("storage", storageUpdate);
      window.removeEventListener("visibilitychange", updateTheme);
      window.removeEventListener("popstate", updateTheme);
    };
    // ナビゲーション時(pathname変化時)にも再実行
  }, [updateTheme, pathname]);
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
        updateTheme,
      }}
    >
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: themeInitScript.replace(/\s+/g, " "),
        }}
      />
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
      className={clsx("fn-link-1", props.className)}
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

export function MenuThemeSwitcher() {
  const t = useTranslations("main.links");
  const themeState = useTheme();
  return (
    <p>
      {themeState.isDark ? (
        <Moon className="inline-block align-middle " />
      ) : (
        <Sun className="inline-block align-middle " />
      )}
      <span className="ml-1 ">{t("theme")}:</span>
      <ThemeSwitcher
        className={clsx(
          "relative inline-block align-top pr-6 text-center",
          "fn-link-1",
          "fn-input"
        )}
      >
        <div>
          {themeState.theme === "dark"
            ? t("dark")
            : themeState.theme === "light"
              ? t("light")
              : t("default")}
        </div>
        <DownOne
          className="absolute right-1 inset-y-0 h-max m-auto"
          theme="filled"
        />
        <span className="block h-0 overflow-hidden">{t("dark")}</span>
        <span className="block h-0 overflow-hidden">{t("light")}</span>
        <span className="block h-0 overflow-hidden">{t("default")}</span>
      </ThemeSwitcher>
    </p>
  );
}
