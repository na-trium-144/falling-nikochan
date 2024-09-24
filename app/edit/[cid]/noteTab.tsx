import { Chart } from "@/chartFormat/chart";
import { NoteCommand } from "@/chartFormat/command";
import Button from "@/common/button";
import Input from "@/common/input";
import { stepStr } from "./str";
import { Step } from "@/chartFormat/step";
import { Key } from "@/common/key";

interface Props {
  currentNoteIndex: number;
  deleteNote: () => void;
  updateNote: (n: NoteCommand) => void;
  copyNote: (i: number) => void;
  pasteNote: (i: number) => void;
  hasCopyBuf: boolean[];
  currentStep: Step;
  chart?: Chart;
}
export default function NoteTab(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <NoteEdit {...props} />
      <span className="flex-1" />
      <div className="flex flex-row ">
        <CopyPasteButton {...props} />
      </div>
    </div>
  );
}
function CopyPasteButton(props: Props) {
  return (
    <>
      <div className="flex flex-col space-y-1 items-stretch">
        <Button
          onClick={() => props.pasteNote(0)}
          text="Paste"
          keyName="V"
          disabled={!props.hasCopyBuf[0]}
        />
        <Button onClick={() => props.copyNote(0)} text="Copy" keyName="C" />
      </div>
      {Array.from(new Array(7)).map((_, i) => (
        <div key={i} className="flex flex-col space-y-1 items-stretch">
          <Button
            onClick={() => props.pasteNote(i + 1)}
            keyName={(i + 1).toString()}
            disabled={!props.hasCopyBuf[i + 1]}
          />
          <Button
            onClick={() => props.copyNote(i + 1)}
            text={(i + 1).toString()}
          />
        </div>
      ))}
    </>
  );
}

function NoteEdit(props: Props) {
  const { currentNoteIndex, chart } = props;
  if (chart && currentNoteIndex >= 0 && chart.notes[currentNoteIndex]) {
    const n = chart.notes[currentNoteIndex];
    const nv = Math.sqrt(Math.pow(n.hitVX, 2) + Math.pow(n.hitVY, 2));
    return (
      <>
        <p>
          <span>Note</span>
          <span className="inline-block w-12 text-right">
            {currentNoteIndex + 1}
          </span>
          <span className="m-1">/</span>
          <span className="">{chart.notes.length}</span>
        </p>
        <table>
          <tbody className="text-center">
            <tr>
              <td className="pr-2">Position:</td>
              <td>x =</td>
              <td>
                <Input
                  actualValue={(n.hitX * 100).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitX: Number(v) / 100 })
                  }
                  isValid={(v) =>
                    !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100
                  }
                />
              </td>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <td className="pr-2">Velocity:</td>
              <td>vx =</td>
              <td>
                <Input
                  actualValue={(n.hitVX * 100).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitVX: Number(v) / 100 })
                  }
                  isValid={(v) => !isNaN(Number(v))}
                />
              </td>
              <td>,</td>
              <td>vy =</td>
              <td>
                <Input
                  actualValue={(n.hitVY * 100).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitVY: Number(v) / 100 })
                  }
                  isValid={(v) => !isNaN(Number(v)) && Number(v) >= 0}
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td>|v| =</td>
              <td>
                <Input
                  actualValue={(nv * 100).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({
                      ...n,
                      hitVX: (Number(v) / 100 / nv) * n.hitVX,
                      hitVY: (Number(v) / 100 / nv) * n.hitVY,
                    })
                  }
                  isValid={(v) => !isNaN(Number(v)) && Number(v) > 0}
                />
              </td>
              <td>,</td>
              <td>angle =</td>
              <td>
                <Input
                  actualValue={(
                    (Math.atan2(n.hitVY, n.hitVX) / Math.PI) *
                    180
                  ).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({
                      ...n,
                      hitVX: nv * Math.cos((Number(v) / 180) * Math.PI),
                      hitVY: nv * Math.sin((Number(v) / 180) * Math.PI),
                    })
                  }
                  isValid={(v) => !isNaN(Number(v)) && nv > 0}
                />
                °
              </td>
            </tr>
            <tr>
              <td className="pr-2">Gravity:</td>
              <td />
              <td />
              <td />
              <td>ay =</td>
              <td>
                <Input
                  actualValue={(n.accelY * 100).toFixed(2)}
                  updateValue={(v) =>
                    props.updateNote({ ...n, accelY: Number(v) / 100 })
                  }
                  isValid={(v) => !isNaN(Number(v))}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          <input
            className="ml-4 mr-1"
            type="checkbox"
            id="bigNote"
            checked={n.big}
            onChange={(v) => props.updateNote({ ...n, big: v.target.checked })}
          />
          <label htmlFor="bigNote">
            <span>Big</span>
            <Key className="text-xs p-0.5 ml-1 ">B</Key>
          </label>
        </p>
        <p className="mt-3">
          {/*<Button
            keyName="N"
            text={`Add note here (at ${stepStr(props.currentStep)})`}
            onClick={() => props.pasteNote(0)}
          />*/}
          <Button text="× Delete this note" onClick={props.deleteNote} />
        </p>
      </>
    );
  } else {
    return (
      <>
        <p>
          <span>No note selected.</span>
        </p>
        <p className="mt-1">
          <Button
            keyName="N"
            text={`Add note here (at ${stepStr(props.currentStep)})`}
            onClick={() => props.pasteNote(0)}
          />
          <span className="ml-1">, or use Paste button.</span>
        </p>
      </>
    );
  }
}
