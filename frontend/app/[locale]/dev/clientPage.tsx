"use client";

import { Box } from "@/common/box";
import { MobileFooterWithGradient, PCFooter } from "@/common/footer";
import { MobileHeader } from "@/common/header";
import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/common/theme";
import { useDisplayMode } from "@/scale";
import YAML from "yaml";
import { linkStyle1 } from "@/common/linkStyle";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import Right from "@icon-park/react/lib/icons/Right";
import Down from "@icon-park/react/lib/icons/Down";
import {
  forceRequestReview,
  historyBackWithForceReview,
  useAndroidTWADetector,
} from "@/common/pwaInstall";
import Button from "@/common/button";
import dynamic from "next/dynamic";
import { Scrollable } from "@/common/scrollable";
const AceEditor = dynamic(
  async () => {
    const ace = await import("react-ace");
    await import("ace-builds/src-min-noconflict/ext-language_tools");
    await import("ace-builds/src-min-noconflict/theme-tomorrow");
    await import("ace-builds/src-min-noconflict/theme-tomorrow_night");
    await import("ace-builds/src-min-noconflict/mode-yaml");
    await import("ace-builds/src-min-noconflict/ext-searchbox");
    return ace;
  },
  { ssr: false }
);

export function DevPage(props: { locale: string }) {
  const t = useTranslations("dev");
  const [ls, setLS] = useState<Storage | null>(null);
  const [ss, setSS] = useState<Storage | null>(null);
  useEffect(() => {
    setLS(localStorage);
    setSS(sessionStorage);
  }, []);
  const isAndroidTWA = useAndroidTWADetector();

  return (
    <main className="w-full h-full overflow-clip ">
      <div className="flex flex-col w-full h-full items-center ">
        <MobileHeader>{t("title")}</MobileHeader>
        <div
          className={clsx(
            "flex-1 min-h-0 w-full px-6 main-wide:pt-3 main-wide:px-6",
            "flex items-center justify-center"
          )}
        >
          <Box
            classNameOuter="w-max h-max max-w-full max-h-full"
            classNameInner="space-y-3"
            scrollableY
            padding={6}
          >
            <div className="hidden mb-3 main-wide:flex flex-row items-center">
              <button
                className={clsx("block w-max", linkStyle1)}
                onClick={() => history.back()}
              >
                <ArrowLeft className="inline-block align-middle mr-2 " />
                {t("back")}
              </button>
              <span className="flex-1 text-center text-xl font-bold font-title">
                {t("title")}
              </span>
            </div>
            <StorageEditor storage={ls} name="LocalStorage" />
            <StorageEditor storage={ss} name="SessionStorage" />
            {isAndroidTWA && (
              <div className="text-center">
                <Button onClick={forceRequestReview}>forceRequestReview</Button>
                <Button onClick={historyBackWithForceReview}>
                  historyBackWithForceReview
                </Button>
              </div>
            )}
          </Box>
        </div>
        <div className="flex-none basis-mobile-footer main-wide:hidden " />
        <PCFooter locale={props.locale} />
      </div>
      <MobileFooterWithGradient locale={props.locale} tabKey={null} />
    </main>
  );
}

interface EProps {
  storage: Storage | null;
  name: string;
}
function StorageEditor(props: EProps) {
  const [code, setCode_] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [message, setMessage] = useState<string[]>([]);
  const themeState = useTheme();
  const { rem } = useDisplayMode();
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const initialStorageData = useRef<Record<string, string>>({});

  useEffect(() => {
    if (props.storage) {
      const keys = Object.keys(props.storage);
      keys.sort();
      initialStorageData.current = {};
      const initialCode: string[] = [];
      for (const key of keys) {
        const valueStr = props.storage.getItem(key)!;
        if (Number(valueStr) > new Date(2024, 1, 1).getTime()) {
          initialCode.push(
            `${key}: ` + new Date(Number(valueStr)).toISOString()
          );
        } else {
          initialCode.push(`${key}: ` + valueStr);
        }
        initialStorageData.current[key] = valueStr;
      }
      setCode_(initialCode.join("\n"));
    }
  }, [props.storage]);
  const setCode = useCallback(
    (code: string) => {
      setCode_(code);
      if (props.storage) {
        try {
          const newObj = YAML.parse(code || "{}");
          const newKeys = Object.keys(newObj);
          const changes: string[] = [];
          props.storage.clear();
          for (const key of newKeys) {
            let newValue: string;
            if (
              typeof newObj[key] === "string" &&
              !isNaN(new Date(newObj[key]).getTime())
            ) {
              newValue = String(new Date(newObj[key]).getTime());
            } else if (newObj[key] === null) {
              newValue = "";
            } else if (typeof newObj[key] !== "object") {
              // string, number
              newValue = String(newObj[key]);
            } else {
              newValue = JSON.stringify(newObj[key]);
            }
            if (!(key in initialStorageData.current)) {
              changes.push(`${key}: '${newValue}' (added)`);
            } else if (initialStorageData.current[key] !== newValue) {
              changes.push(
                `${key}: '${initialStorageData.current[key]}' -> '${newValue}'`
              );
            }
            props.storage.setItem(key, newValue);
          }
          for (const key of Object.keys(initialStorageData.current)) {
            if (!newKeys.includes(key)) {
              changes.push(
                `${key}: removed '${initialStorageData.current[key]}'`
              );
            }
          }
          setIsError(false);
          setMessage(changes);
        } catch (e) {
          setIsError(true);
          setMessage([String(e)]);
        }
      }
    },
    [props.storage]
  );

  return (
    <div className="">
      <div className="text-center text-lg font-bold font-title">
        <button
          className={clsx(
            "rounded-full cursor-pointer px-2 py-1",
            "hover:bg-slate-200/50 active:bg-slate-300/50",
            "hover:dark:bg-stone-700/50 active:dark:bg-stone-600/50",
            linkStyle1
          )}
          onClick={() => setShowEditor(!showEditor)}
        >
          {props.name} ({props.storage?.length})
          {showEditor ? (
            <Down className="inline-block align-middle " />
          ) : (
            <Right className="inline-block align-middle " />
          )}
        </button>
      </div>
      <Box
        classNameOuter={clsx("mt-2", !showEditor && "hidden")}
        classNameInner="overflow-hidden"
      >
        <div className="rounded-t-sq-box">
          <AceEditor
            mode="yaml"
            theme={themeState.isDark ? "tomorrow_night" : "tomorrow"}
            width="calc(100dvw - 6rem)"
            height="calc(100dvh - 19rem)" // てきとう
            tabSize={2}
            fontSize={1 * rem}
            highlightActiveLine={false}
            setOptions={{ useWorker: false }}
            value={code}
            onChange={(value) => {
              setCode(value);
            }}
          />
        </div>
        <div
          className={clsx(
            "bg-slate-200/50 dark:bg-stone-700/50 rounded-b-sq-box",
            "shadow-[0_-2px_4px] shadow-slate-200 dark:shadow-stone-700",
            "overflow-hidden"
          )}
        >
          <Scrollable
            className={clsx(
              "text-sm break-all",
              "h-24 max-h-24",
              isError && "text-red-600 dark:text-red-400"
            )}
            padding={2}
            scrollableY
          >
            {message.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </Scrollable>
        </div>
      </Box>
    </div>
  );
}
