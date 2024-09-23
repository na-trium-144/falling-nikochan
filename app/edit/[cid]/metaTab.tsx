import Button from "@/common/button";
import Input from "@/common/input";
import { checkYouTubeId, getYouTubeId } from "@/common/youtube";
import { useEffect, useState } from "react";
import msgpack from "@ygoe/msgpack";
import { saveAs } from "file-saver";
import { Chart } from "@/chartFormat/chart";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
}
export function MetaEdit(props: Props) {
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
    </>
  );
}

interface Props2 {
  chart?: Chart;
  setChart: (chart: Chart) => void;
  cid: string;
}
export function MetaTab(props: Props2) {
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [saveMsg, setSaveMsg] = useState<string>("");
  useEffect(() => {
    setErrorMsg("");
    setSaveMsg("");
  }, [props.chart]);
  return (
    <>
      <MetaEdit {...props} />
      <p>
        <Button
          text="サーバーに保存"
          onClick={async () => {
            const res = await fetch(`/api/chartFile/${props.cid}`, {
              method: "POST",
              body: msgpack.serialize(props.chart),
            });
            if (res.ok) {
              setErrorMsg("保存しました！");
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
    </>
  );
}
