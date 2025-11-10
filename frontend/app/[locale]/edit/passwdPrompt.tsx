import Button from "@/common/button";
import CheckBox from "@/common/checkBox";
import Input from "@/common/input";
import { linkStyle1 } from "@/common/linkStyle";
import clsx from "clsx/lite";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface PasswdProps {
  cid: string;
  passwdFailed: boolean;
  fetchChart: (
    cid: string,
    isFirst: boolean,
    bypass: boolean,
    editPasswd: string,
    savePasswd: boolean
  ) => Promise<void>;
  savePasswd: boolean;
  setSavePasswd: (savePasswd: boolean) => void;
}
export function PasswdPrompt(props: PasswdProps) {
  const t = useTranslations("edit");
  const passwdRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (passwdRef.current) {
      passwdRef.current.focus();
      passwdRef.current.select();
    }
  }, []);
  const [editPasswd, setEditPasswd] = useState<string>("");

  return (
    <div className="text-center ">
      <p className="mb-2 ">
        <span className="">{t("chartId")}:</span>
        <span className="ml-2 ">{props.cid}</span>
      </p>
      <p>{t("enterPasswd")}</p>
      {props.passwdFailed && <p>{t("passwdFailed")}</p>}
      <Input
        ref={passwdRef}
        actualValue={editPasswd}
        updateValue={setEditPasswd}
        left
        passwd
        onEnter={(editPasswd) =>
          props.fetchChart(
            props.cid,
            false,
            false,
            editPasswd,
            props.savePasswd
          )
        }
      />
      <Button
        text={t("submitPasswd")}
        onClick={() =>
          props.fetchChart(
            props.cid,
            false,
            false,
            editPasswd,
            props.savePasswd
          )
        }
      />
      <p>
        <CheckBox value={props.savePasswd} onChange={props.setSavePasswd}>
          {t("savePasswd")}
        </CheckBox>
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-2 ">
          <button
            className={clsx(linkStyle1, "w-max m-auto")}
            onClick={() =>
              props.fetchChart(
                props.cid,
                false,
                true,
                editPasswd,
                props.savePasswd
              )
            }
          >
            {t("bypassPasswd")}
          </button>
        </p>
      )}
    </div>
  );
}
