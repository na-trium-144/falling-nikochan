"use client";

import { Box } from "@/common/box";
import { MobileFooter, PCFooter } from "@/common/footer";
import { MobileHeader } from "@/common/header";
import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import AceEditor from "react-ace";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-min-noconflict/theme-github";
import "ace-builds/src-min-noconflict/theme-monokai";
import "ace-builds/src-min-noconflict/mode-yaml";
import "ace-builds/src-min-noconflict/ext-searchbox";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/common/theme";
import { useDisplayMode } from "@/scale";
import YAML from "yaml";
import { linkStyle1 } from "@/common/linkStyle";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft";
import Right from "@icon-park/react/lib/icons/Right";
import Down from "@icon-park/react/lib/icons/Down";

export function DevPage(props: { locale: string }) {
  const t = useTranslations("dev");
  const [ls, setLS] = useState<Storage | null>(null);
  const [ss, setSS] = useState<Storage | null>(null);
  useEffect(() => {
    setLS(localStorage);
    setSS(sessionStorage);
  }, []);

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
          <Box className="w-max h-max max-w-full max-h-full p-6 overflow-y-auto space-y-3">
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
          </Box>
        </div>
        <div className="flex-none basis-15 main-wide:hidden " />
        <PCFooter locale={props.locale} />
      </div>
      <div
        className={clsx(
          "fixed bottom-0 inset-x-0 backdrop-blur-2xs",
          "bg-gradient-to-t from-30% from-sky-50 to-sky-50/0",
          "dark:from-orange-950 dark:to-orange-950/0"
        )}
      >
        <MobileFooter locale={props.locale} tabKey={null} />
      </div>
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
          for (const key of newKeys) {
            let newValue: string;
            if (
              typeof newObj[key] === "string" &&
              !isNaN(new Date(newObj[key]).getTime())
            ) {
              newValue = String(new Date(newObj[key]).getTime());
            } else if (typeof newObj[key] !== "object") {
              newValue = String(newObj[key]);
            } else {
              newValue = JSON.stringify(newObj[key]);
            }
            if (!(key in initialStorageData.current)) {
              changes.push(`${key}: '${newValue}' (added)`);
              props.storage.setItem(key, newValue);
            } else if (initialStorageData.current[key] !== newValue) {
              changes.push(
                `${key}: '${initialStorageData.current[key]}' -> '${newValue}'`
              );
              props.storage.setItem(key, newValue);
            }
          }
          for (const key of Object.keys(initialStorageData.current)) {
            if (!newKeys.includes(key)) {
              changes.push(
                `${key}: removed '${initialStorageData.current[key]}'`
              );
              props.storage.removeItem(key);
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
      {showEditor && (
        <div className="mt-2">
          <AceEditor
            mode="yaml"
            theme={themeState.isDark ? "monokai" : "github"}
            width="calc(100dvw - 6rem)"
            height="calc(100dvh - 16rem)" // てきとう
            tabSize={2}
            fontSize={1 * rem}
            value={code}
            onChange={(value) => {
              setCode(value);
            }}
          />
          <div
            className={clsx(
              "bg-slate-200 dark:bg-stone-700 mt-2 p-1 text-sm rounded-sm break-all",
              "h-18 max-h-18 overflow-auto",
              isError && "text-red-600 dark:text-red-400"
            )}
          >
            {message.map((m, i) => (
              <p key={i}>{m}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
