import Button, { buttonStyle } from "@/common/button";
import Input from "@/common/input";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId";
import { ChangeEvent, useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import {
  Chart,
  chartMaxSize,
  createBrief,
  hashPasswd,
  levelBgColors,
  validateChart,
} from "@/chartFormat/chart";
import { getPasswd, setPasswd } from "@/common/passwdCache";
import { addRecent } from "@/common/recent";
import { initSession, SessionData } from "@/play/session";
import { linkStyle1, linkStyle2 } from "@/common/linkStyle";
import { ExternalLink } from "@/common/extLink";
import ProgressBar from "@/common/progressBar";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
}
export function MetaEdit(props: Props) {
  const [hidePasswd, setHidePasswd] = useState<boolean>(true);
  return (
    <>
      <p className="mb-2">
        <span className="w-max">YouTube URL または動画ID</span>
        <Input
          className=""
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
      <p className="ml-2">
        <span className="inline-block w-max">楽曲タイトル</span>
        <Input
          className="font-title shrink w-80 max-w-full "
          actualValue={props.chart?.title || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, title: v })
          }
          left
        />
      </p>
      <p className="ml-2 ">
        <span className="inline-block w-max">作曲者など</span>
        <Input
          className="text-sm font-title shrink w-80 max-w-full"
          actualValue={props.chart?.composer || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, composer: v })
          }
          left
        />
      </p>
      <p className="ml-2 mb-2">
        <span className="inline-block w-max">譜面作成者(あなたの名前)</span>
        <Input
          className="font-title shrink w-40 max-w-full"
          actualValue={props.chart?.chartCreator || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, chartCreator: v })
          }
          left
        />
      </p>
      <p className="">
        <span className="inline-block w-max">編集用パスワード</span>
        <span className="inline-flex flex-row items-baseline">
          <Input
            className="font-title shrink w-40 "
            actualValue={props.chart?.editPasswd || ""}
            updateValue={(v: string) =>
              props.chart && props.setChart({ ...props.chart, editPasswd: v })
            }
            left
            passwd={hidePasswd}
          />
          <Button text="表示" onClick={() => setHidePasswd(!hidePasswd)} />
        </span>
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
  fileSize: number;
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
            history.replaceState(null, "", `/edit/${resBody.cid}`);
            setErrorMsg("保存しました！");
            addRecent("edit", resBody.cid);
            props.setHasChange(false);
            try {
              setPasswd(resBody.cid, await hashPasswd(props.chart!.editPasswd));
            } catch (e) {
              setErrorMsg(String(e));
            }
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
        try {
          setPasswd(props.cid, await hashPasswd(props.chart!.editPasswd));
        } catch (e) {
          setErrorMsg("保存しました！ (パスワードの保存は失敗)");
        }
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
      setUploadMsg("");
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
      target.value = "";
    }
  };

  return (
    <>
      <div className="mb-2">
        <span className="">現在のファイルサイズ:</span>
        <span className="inline-block">
          <span className="ml-2">{Math.round(props.fileSize / 1000)} kB</span>
          <span className="ml-1 text-sm ">(Max. {chartMaxSize / 1000} kB)</span>
        </span>
        <ProgressBar value={props.fileSize / chartMaxSize} />
      </div>
      <div className="mb-1">
        <ExternalLink
          onClick={() => {
            if (props.sessionData) {
              initSession(props.sessionData, props.sessionId);
              window.open(`/play?sid=${props.sessionId}`, "_blank")?.focus();
            }
          }}
        >
          テストプレイ
        </ExternalLink>
      </div>
      <div className="">
        <span className="inline-block">
          譜面ID:
          <span className="ml-1 mr-2 ">{props.cid || "(未保存)"}</span>
        </span>
        <Button text="サーバーに保存" onClick={save} loading={saving} />
        <span className="inline-block ml-1 ">{errorMsg}</span>
        {props.hasChange && (
          <span className="inline-block ml-1 text-amber-600 ">
            (未保存の変更があります)
          </span>
        )}
      </div>
      {props.cid && (
        <>
          <div className="ml-2">
            <span className="hidden edit-wide:inline-block mr-2">
              共有用リンク:
            </span>
            <ExternalLink href={`/share/${props.cid}`}>
              <span className="edit-wide:hidden">共有用リンク</span>
              <span className="hidden edit-wide:inline text-sm">
                {origin}/share/{props.cid}
              </span>
            </ExternalLink>
            {hasClipboard && (
              <Button
                className="ml-2"
                text="コピー"
                onClick={() =>
                  navigator.clipboard.writeText(`${origin}/share/${props.cid}`)
                }
              />
            )}
          </div>
        </>
      )}
      <div className="mb-4">
        <span className="">ローカルに保存/読み込み:</span>
        <span className="inline-block ml-1">
          <Button text="保存" onClick={download} />
          <label className={buttonStyle + " inline-block"} htmlFor="upload-bin">
            ファイルを開く
          </label>
          <span className="inline-block ml-1">{saveMsg || uploadMsg}</span>
          <input
            type="file"
            className="hidden"
            id="upload-bin"
            name="upload-bin"
            onChange={upload}
          />
        </span>
      </div>
      <MetaEdit {...props} />
    </>
  );
}
