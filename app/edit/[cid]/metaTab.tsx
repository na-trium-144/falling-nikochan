import Button, { buttonStyle } from "@/common/button";
import Input from "@/common/input";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId";
import { ChangeEvent, useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import {
  Chart,
  createBrief,
  hashPasswd,
  validateChart,
} from "@/chartFormat/chart";
import { getPasswd, setPasswd } from "@/common/passwdCache";
import { addRecent } from "@/common/recent";
import { EfferentThree } from "@icon-park/react";
import { initSession, SessionData } from "@/play/session";
import { linkStyle1, linkStyle2 } from "@/common/linkStyle";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
}
export function MetaEdit(props: Props) {
  const [hidePasswd, setHidePasswd] = useState<boolean>(true);
  return (
    <>
      <p className="flex flex-row items-baseline mb-2">
        <span className="w-max">YouTube URL または動画ID</span>
        <Input
          className="flex-1"
          actualValue={props.chart?.ytId || ""}
          updateValue={(v: string) =>
            props.chart &&
            props.setChart({ ...props.chart, ytId: getYouTubeId(v) })
          }
          isValid={checkYouTubeId}
          left
        />
      </p>
      <p>楽曲情報:</p>
      <p className="flex flex-row items-baseline ml-2">
        <span className="w-max">楽曲タイトル</span>
        <Input
          className="font-title shrink w-80"
          actualValue={props.chart?.title || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, title: v })
          }
          left
        />
      </p>
      <p className="flex flex-row items-baseline ml-2 ">
        <span className="w-max">作曲者など</span>
        <Input
          className="text-sm font-title shrink w-80"
          actualValue={props.chart?.composer || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, composer: v })
          }
          left
        />
      </p>
      <p className="flex flex-row items-baseline ml-2 mb-2">
        <span className="w-max">譜面作成者(あなたの名前)</span>
        <Input
          className="font-title shrink w-40"
          actualValue={props.chart?.chartCreator || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, chartCreator: v })
          }
          left
        />
      </p>
      <p className="flex flex-row items-baseline">
        <span className="w-max">編集用パスワード</span>
        <Input
          className="font-title shrink w-40"
          actualValue={props.chart?.editPasswd || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, editPasswd: v })
          }
          left
          passwd={hidePasswd}
        />
        <Button text="表示" onClick={() => setHidePasswd(!hidePasswd)} />
      </p>
      <p className="text-sm ml-2">
        (編集用パスワードは譜面を別のPCから編集するとき、ブラウザのキャッシュを消したときなどに必要になります)
      </p>
    </>
  );
}

interface Props2 {
  sessionId?: number;
  sessionData?: SessionData;
  chart?: Chart;
  setChart: (chart: Chart) => void;
  cid: string | undefined;
  setCid: (cid: string) => void;
  hasChange: boolean;
  setHasChange: (h: boolean) => void;
  currentLevelIndex: number;
}
export function MetaTab(props: Props2) {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [hasClipboard, setHasClipboard] = useState<boolean>(false);
  useEffect(() => {
    setErrorMsg("");
    setSaveMsg("");
    setOrigin(window.location.origin);
    setHasClipboard(!!navigator?.clipboard);
  }, [props.chart]);

  const save = async () => {
    setSaving(true);
    if (props.cid === undefined) {
      const res = await fetch(`/api/newChartFile/`, {
        method: "POST",
        body: msgpack.serialize(props.chart),
        cache: "no-store",
      });
      if (res.ok) {
        try {
          const resBody = await res.json();
          if (typeof resBody.cid === "string") {
            props.setCid(resBody.cid);
            setPasswd(resBody.cid, await hashPasswd(props.chart!.editPasswd));
            history.replaceState(null, "", `/edit/${resBody.cid}`);
            setErrorMsg("保存しました！");
            addRecent("edit", resBody.cid);
            props.setHasChange(false);
          } else {
            setErrorMsg("Invalid response");
          }
        } catch {
          setErrorMsg("Invalid response");
        }
      } else {
        try {
          const resBody = await res.json();
          setErrorMsg(`${res.status}: ${resBody.message}`);
        } catch {
          setErrorMsg(`${res.status} Error`);
        }
      }
    } else {
      const res = await fetch(
        `/api/chartFile/${props.cid}?p=${getPasswd(props.cid)}`,
        {
          method: "POST",
          body: msgpack.serialize(props.chart),
          cache: "no-store",
        }
      );
      if (res.ok) {
        props.setHasChange(false);
        setErrorMsg("保存しました！");
        // 次からは新しいパスワードが必要
        setPasswd(props.cid, await hashPasswd(props.chart!.editPasswd));
      } else {
        try {
          const resBody = await res.json();
          setErrorMsg(`${res.status}: ${resBody.message}`);
        } catch {
          setErrorMsg(`${res.status} Error`);
        }
      }
    }
    setSaving(false);
  };
  const download = () => {
    // editPasswdだけ消す
    const blob = new Blob([
      msgpack.serialize({ ...props.chart, editPasswd: "" }),
    ]);
    const filename = `${props.cid}_${props.chart?.title}.fn${props.chart?.ver}.mpk`;
    saveAs(blob, filename);
    setSaveMsg(`保存しました！ (${filename})`);
  };
  const upload = async (e: ChangeEvent) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length >= 1) {
      const f = target.files[0];
      try {
        let newChart = msgpack.deserialize(await f.arrayBuffer());
        newChart = await validateChart(newChart);
        if (confirm("このファイルで譜面データを上書きしますか?")) {
          props.setChart({
            ...newChart,
            editPasswd: props.chart?.editPasswd || "",
          });
        }
      } catch (e) {
        setUploadMsg(String(e));
      }
      target.files = null;
    }
  };

  return (
    <>
      <p className="mb-1">
        <a
          className={"relative inline-block " + linkStyle1}
          href={`/play?sid=${props.sessionId}`}
          target="_blank"
        >
          <button
            onClick={() =>
              props.sessionData &&
              initSession(props.sessionData, props.sessionId)
            }
          >
            <span className="mr-5">テストプレイ</span>
            <EfferentThree className="absolute bottom-1 right-0" />
          </button>
        </a>
      </p>
      <p className="">
        譜面ID:
        <span className="ml-1 mr-2 ">{props.cid || "(未保存)"}</span>
        <Button text="サーバーに保存" onClick={save} loading={saving} />
        <span className="ml-1">{errorMsg}</span>
        {props.hasChange && (
          <span className="ml-1">(未保存の変更があります)</span>
        )}
      </p>
      {props.cid && (
        <>
          <p className="ml-2">
            <span className="hidden edit-wide:inline-block mr-2">
              共有用リンク:
            </span>
            <a
              className={linkStyle2}
              href={`/share/${props.cid}`}
              target="_blank"
            >
              <span className="edit-wide:hidden">共有用リンク</span>
              <span className="hidden edit-wide:inline text-sm">
                {origin}/share/{props.cid}
              </span>
            </a>
            {hasClipboard && (
              <Button
                className="ml-2"
                text="コピー"
                onClick={() =>
                  navigator.clipboard.writeText(`${origin}/share/${props.cid}`)
                }
              />
            )}
          </p>
        </>
      )}
      <p className="mb-4">
        <span className="mr-1">ローカルに保存/読み込み:</span>
        <Button text="ダウンロードして保存" onClick={download} />
        <label className={buttonStyle + " inline-block"} htmlFor="upload-bin">
          アップロード
        </label>
        <span className="ml-1">{saveMsg || uploadMsg}</span>
        <input
          type="file"
          className="hidden"
          id="upload-bin"
          name="upload-bin"
          onChange={upload}
        />
      </p>
      <MetaEdit {...props} />
    </>
  );
}
