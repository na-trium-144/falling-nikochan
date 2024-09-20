import { Chart } from "@/chartFormat/command";
import Input from "@/common/input";
import { checkYouTubeId, getYouTubeId } from "@/common/youtube";

interface Props {
  chart?: Chart;
  setChart: (chart: Chart) => void;
}
export default function MetaTab(props: Props) {
  return (
    <>
      <p className="flex flex-row">
        <span className="w-max">YouTube URL or ID</span>
        <Input
          className="flex-1"
          actualValue={props.chart?.ytId || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, ytId: getYouTubeId(v) })
          }
          isValid={checkYouTubeId}
          left
        />
      </p>
      <p className="flex flex-row">
        <span className="w-max">Title</span>
        <Input
        className="flex-1 font-title"
          actualValue={props.chart?.title || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, title: v })
          }
          left
        />
      </p>
      <p className="flex flex-row text-sm mt-1">
        <span className="w-max">Composer etc.</span>
        <Input
        className="flex-1 text-sm font-title"
          actualValue={props.chart?.composer || ""}
          updateValue={(v: string) =>
            props.chart && props.setChart({ ...props.chart, composer: v })
          }
          left
        />
      </p>
    </>
  );
}
