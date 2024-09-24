import Button from "@/common/button";
import Input from "@/common/input";
import { checkYouTubeId, getYouTubeId } from "@/common/ytId";
import { useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import { Chart, hashPasswd, validateChart } from "@/chartFormat/chart";
import { getPasswd, setPasswd } from "@/common/passwdCache";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
}
export function MetaEdit(props: Props) {
  const [hidePasswd, setHidePasswd] = useState<boolean>(true);
  return (
    <>
      <p className="flex flex-row">
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
      <p className="flex flex-row">
        <span className="w-max">楽曲タイトル</span>
        <Input
          className="flex-1 font-title"
          actualValue={props.chart?.title || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, title: v })
          }
          left
        />
      </p>
      <p className="flex flex-row text-sm my-1">
        <span className="w-max">(作曲者など</span>
        <Input
          className="flex-1 text-sm font-title"
          actualValue={props.chart?.composer || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, composer: v })
          }
          left
        />
        <span>)</span>
      </p>
      <p className="flex flex-row">
        <span className="w-max">譜面作成者(あなたの名前)</span>
        <Input
          className="flex-1 font-title"
          actualValue={props.chart?.chartCreator || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, chartCreator: v })
          }
          left
        />
      </p>
      <p className="flex flex-row">
        <span className="w-max">編集用パスワード</span>
        <Input
          className="flex-1 font-title"
          actualValue={props.chart?.editPasswd || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, editPasswd: v })
          }
          left
          passwd={hidePasswd}
        />
        <Button text="表示" onClick={() => setHidePasswd(!hidePasswd)} />
      </p>
      <p className="text-sm">
        (編集用パスワードは譜面を別のPCから編集するとき、ブラウザのキャッシュを消したときなどに必要になります)
      </p>
    </>
  );
}

interface Props2 {
  chart?: Chart;
  setChart: (chart: Chart) => void;
  cid: string;
  hasChange: boolean;
  setHasChange: (h: boolean) => void;
}
export function MetaTab(props: Props2) {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState<string>("");
  const [auto, setAuto] = useState<boolean>(false);
  useEffect(() => {
    setErrorMsg("");
    setSaveMsg("");
  }, [props.chart]);
  return (
    <>
      <MetaEdit {...props} />
      <p className="mt-2">
        <Button
          text="サーバーに保存"
          onClick={async () => {
            const res = await fetch(
              `/api/chartFile/${props.cid}?p=${await hashPasswd(
                getPasswd(props.cid)
              )}`,
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
              setPasswd(props.cid, props.chart!.editPasswd);
            } else {
              try {
                const resBody = await res.json();
                setErrorMsg(`${res.status}: ${resBody.message}`);
              } catch (e) {
                setErrorMsg(String(e));
              }
            }
          }}
        />
        <span className="ml-1">{errorMsg}</span>
        {props.hasChange && (
          <span className="ml-1">(未保存の変更があります)</span>
        )}
      </p>
      <p>
        <Button
          text="ダウンロードして保存"
          onClick={() => {
            const blob = new Blob([msgpack.serialize(props.chart)]);
            const filename = `${props.cid}_${props.chart?.title}.bin`;
            saveAs(blob, filename);
            setSaveMsg(`保存しました！ (${filename})`);
          }}
        />
        <span className="ml-1">{saveMsg}</span>
      </p>
      <p>
        <label htmlFor="upload-bin">ローカルのファイルをアップロード:</label>
        <input
          type="file"
          id="upload-bin"
          name="upload-bin"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length >= 1) {
              const f = e.target.files[0];
              try {
                const newChart = msgpack.deserialize(await f.arrayBuffer());
                validateChart(newChart);
                if(confirm("このファイルで譜面データを上書きしますか?")){
                  props.setChart(newChart);
                }
              } catch (e) {
                setUploadMsg(String(e));
              }
              e.target.files = null;
            }
          }}
        />
        <span className="ml-1">{uploadMsg}</span>
      </p>
      <p className="mt-2">
        <a
          className="hover:text-blue-600 hover:underline"
          href={`/play/${props.cid}?auto=${auto ? 1 : 0}`}
          target="_blank"
        >
          ゲーム画面へ(新しいタブ)...
        </a>
        <input
          className="ml-2 mr-1"
          type="checkbox"
          id="auto"
          checked={auto}
          onChange={(v) => setAuto(v.target.checked)}
        />
        <label htmlFor="auto">
          <span>オートプレイ</span>
        </label>
      </p>
    </>
  );
}
