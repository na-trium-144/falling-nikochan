"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "@/intlProvider";
import { IrasutoyaLikeBg } from "./irasutoyaLike.jsx";
import Moon from "@icon-park/react/lib/icons/Moon";
import Sun from "@icon-park/react/lib/icons/Sun";
import themeInitScript from "./themeInit.js?raw";
import { usePathname } from "next/navigation";
import { SmallSelect } from "./select";

declare global {
  var fnGetCurrentTheme: () => "dark" | "light" | null;
  var fnCurrentThemeIsDark: () => boolean;
  var fnApplyTheme: () => void;
}

export interface ThemeState {
  theme: "dark" | "light" | null;
  isDark: boolean;
}
export function useTheme() {
  const pathname = usePathname();
  const subscribe = useCallback(
    (updateTheme: () => void) => {
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
    },
    // ナビゲーション時(pathname変化時)にも再実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );
  const prevTheme = useRef<ThemeState>({ theme: null, isDark: false });
  const { theme, isDark } = useSyncExternalStore(
    subscribe,
    () => {
      try {
        const theme = window.fnGetCurrentTheme();
        const isDark = window.fnCurrentThemeIsDark();
        if (
          prevTheme.current.theme !== theme ||
          prevTheme.current.isDark !== isDark
        ) {
          prevTheme.current = { theme, isDark };
        }
      } catch (e) {
        console.error(e);
        // Sentryに報告せず無視
      }
      return prevTheme.current;
    },
    () => prevTheme.current
  );
  const setTheme = useCallback((theme: "dark" | "light" | null) => {
    if (theme !== null) {
      localStorage?.setItem("theme", theme);
    } else {
      localStorage?.removeItem("theme");
    }
    window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
  }, []);

  return { theme, isDark, setTheme };
}

export function ThemeInitializer() {
  const { theme } = useTheme();
  useEffect(() => {
    try {
      window.fnApplyTheme();
    } catch (e) {
      console.error(e);
      // Sentryに報告せず無視
    }
  }, [theme]);
  return (
    <>
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: themeInitScript.replace(/\s+/g, " "),
        }}
      />
      <div className="fn-fallback-bg" />
      <IrasutoyaLikeBg />
      <div className="fn-ios-dummy-block fn-ios-dummy-block-top" />
      <div className="fn-ios-dummy-block fn-ios-dummy-block-bottom" />
      {process.env.NODE_ENV === "development" && (
        <>
          <div className="fn-dev-safe-area fn-dev-sai-t" />
          <div className="fn-dev-safe-area fn-dev-sai-b" />
          <div className="fn-dev-safe-area fn-dev-sai-l" />
          <div className="fn-dev-safe-area fn-dev-sai-r" />
        </>
      )}
    </>
  );
}

export function MenuThemeSwitcher() {
  const t = useTranslations("main.links");
  const themeState = useTheme();
  const { theme, setTheme } = useTheme();
  const tf = useTranslations("footer");
  return (
    <p>
      {themeState.isDark ? (
        <Moon className="inline-block align-middle " />
      ) : (
        <Sun className="inline-block align-middle " />
      )}
      <span className="ml-1 ">{t("theme")}:</span>
      <SmallSelect
        classNameInner="flex-col"
        value={theme}
        options={[
          { value: "dark" as const, label: tf("dark") },
          { value: "light" as const, label: tf("light") },
          { value: null, label: tf("default") },
        ]}
        onSelect={(value) => {
          if (value === "dark" || value === "light") {
            setTheme(value);
          } else {
            setTheme(null);
          }
        }}
      >
        <div>
          {themeState.theme === "dark"
            ? t("dark")
            : themeState.theme === "light"
              ? t("light")
              : t("default")}
        </div>
        <span className="block h-0 overflow-hidden">{t("dark")}</span>
        <span className="block h-0 overflow-hidden">{t("light")}</span>
        <span className="block h-0 overflow-hidden">{t("default")}</span>
      </SmallSelect>
    </p>
  );
}
