import { Chart, NoteCommand } from "@/chartFormat/command";
import Button from "./button";
import Input from "./input";

interface Props {
  currentNoteIndex: number | null;
  addNote: () => void;
  deleteNote: () => void;
  updateNote: (n: NoteCommand) => void;
  chart: Chart | null;
}
export default function NoteTab(props: Props) {
  const { currentNoteIndex, chart } = props;
  if (chart && currentNoteIndex !== null && currentNoteIndex >= 0) {
    const n = chart.notes[currentNoteIndex];
    return (
      <>
        <p>
          <span>Note</span>
          <span className="inline-block w-12 text-right">
            {currentNoteIndex + 1}
          </span>
          <span className="m-1">/</span>
          <span className="">{chart.notes.length}</span>
          <Button text="× Delete this note" onClick={props.deleteNote} />
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
      </>
    );
  } else {
    return (
      <>
        <p>
          <span>No note selected.</span>
          <Button
            text="+ Add a note here"
            keyName="N"
            onClick={props.addNote}
          />
        </p>
      </>
    );
  }
}
