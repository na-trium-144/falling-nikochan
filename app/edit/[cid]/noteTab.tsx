import { Chart, Level } from "@/chartFormat/chart";
import { NoteCommand } from "@/chartFormat/command";
import Button from "@/common/button";
import Input from "@/common/input";
import { Step, stepCmp } from "@/chartFormat/step";
import { Key } from "@/common/key";
import { Mouse } from "@icon-park/react";
import CheckBox from "@/common/checkBox";
import { getSignatureState } from "@/chartFormat/seq";

interface Props {
  currentNoteIndex: number;
  hasCurrentNote: boolean;
  notesCountInStep: number;
  notesIndexInStep: number;
  canAddNote: boolean;
  addNote: () => void;
  deleteNote: () => void;
  updateNote: (n: NoteCommand) => void;
  copyNote: (i: number) => void;
  pasteNote: (i: number) => void;
  hasCopyBuf: boolean[];
  currentStep: Step;
  currentLevel?: Level;
}
export default function NoteTab(props: Props) {
  const noteEditable =
    props.currentLevel?.notes[props.currentNoteIndex] &&
    props.currentLevel?.notes[props.currentNoteIndex].luaLine !== null;

  const ss =
    props.currentLevel &&
    getSignatureState(props.currentLevel.signature, props.currentStep);
  return (
    <div className="flex flex-col h-full">
      <p>
        <span>Step</span>
        <span className="inline-block text-right w-6">
          {ss && ss.barNum + 1}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {ss && ss.count.fourth + 1}
        </span>
        <div className="w-20 inline-block">
          {props.currentStep.numerator > 0 && (
            <>
              <span className="ml-2 ">+</span>
              <span className="inline-block text-right w-6">
                {ss?.count.numerator}
              </span>
              <span className="ml-1 mr-1">/</span>
              <span>{ss && ss.count.denominator * 4}</span>
            </>
          )}
        </div>
        <div className="inline-block ml-2 w-28">
          <span>Note</span>
          <span className="inline-block text-right w-6">
            {props.hasCurrentNote ? props.notesIndexInStep + 1 : "-"}
          </span>
          <span className="ml-1 ">/</span>
          <span className="inline-block ml-1">{props.notesCountInStep}</span>
        </div>
        <div className="inline-block">
          <Button
            keyName="N"
            text={`Add`}
            onClick={() => props.addNote()}
            disabled={!props.canAddNote}
          />
          {props.hasCurrentNote && (
            <Button
              text="Delete"
              onClick={props.deleteNote}
              disabled={!noteEditable}
            />
          )}
        </div>
      </p>
      <p className="mb-1">
        <span>Total Notes:</span>
        <span className="inline-block w-12 text-right">
          {props.hasCurrentNote ? props.currentNoteIndex + 1 : "-"}
        </span>
        <span className="mx-1">/</span>
        <span className="">{props.currentLevel?.notes.length || 0}</span>
      </p>
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
      <div className="flex flex-col items-stretch">
        <Button
          onClick={() => props.pasteNote(0)}
          text="Paste"
          keyName="V"
          disabled={!props.hasCopyBuf[0]}
        />
        <Button onClick={() => props.copyNote(0)} text="Copy" keyName="C" />
      </div>
      {Array.from(new Array(9)).map((_, i) => (
        <div key={i} className="flex flex-col items-stretch">
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
  const { currentNoteIndex, currentLevel } = props;
  const noteEditable =
    props.currentLevel?.notes[props.currentNoteIndex] &&
    props.currentLevel?.notes[props.currentNoteIndex].luaLine !== null;
  if (
    currentLevel &&
    currentNoteIndex >= 0 &&
    currentLevel.notes[currentNoteIndex]
  ) {
    const n = currentLevel.notes[currentNoteIndex];
    const nv = Math.sqrt(Math.pow(n.hitVX, 2) + Math.pow(n.hitVY, 2));
    return (
      <>
        <table className="w-max mb-4">
          <tbody className="text-center">
            <tr>
              <td className="pr-2 ">
                <span>Position</span>
                <span className="inline-block ml-1">
                  (
                  <span className="inline-block">
                    <Mouse className="" />
                  </span>
                  )
                </span>
              </td>
              <td>x =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitX.toString()}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitX: Number(v) })
                  }
                  isValid={(v) =>
                    !isNaN(Number(v)) && Number(v) >= -5 && Number(v) <= 5
                  }
                  disabled={!noteEditable}
                />
              </td>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <td className="pr-2">
                <span>Velocity</span>
                <span className="inline-block ml-1">
                  (<Key className="px-1 py-0.5 mx-0.5 text-sm">Shift</Key>+
                  <span className="inline-block">
                    <Mouse className="" />
                  </span>
                  )
                </span>
              </td>
              <td>vx =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitVX.toString()}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitVX: Number(v) })
                  }
                  isValid={(v) => !isNaN(Number(v))}
                  disabled={!noteEditable}
                />
              </td>
              <td>,</td>
              <td>vy =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitVY.toString()}
                  updateValue={(v) =>
                    props.updateNote({ ...n, hitVY: Number(v) })
                  }
                  isValid={(v) => !isNaN(Number(v)) && Number(v) >= 0}
                  disabled={!noteEditable}
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td>|v| =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={(Math.round(nv * 100) / 100).toString()}
                  updateValue={(v) =>
                    props.updateNote({
                      ...n,
                      hitVX: (Number(v) / nv) * n.hitVX,
                      hitVY: (Number(v) / nv) * n.hitVY,
                    })
                  }
                  isValid={(v) => !isNaN(Number(v)) && Number(v) > 0}
                  disabled={!noteEditable}
                />
              </td>
              <td>,</td>
              <td>angle =</td>
              <td>
                <Input
                  className="w-20"
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
                  disabled={!noteEditable}
                />
                °
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          <CheckBox
            className="mr-1"
            value={n.big}
            onChange={(v) => props.updateNote({ ...n, big: v })}
            disabled={!noteEditable}
          >
            <span>Big</span>
            <Key className="text-xs p-0.5 ml-1 ">B</Key>
          </CheckBox>
        </p>
        {props.currentLevel?.notes[props.currentNoteIndex] && !noteEditable && (
          <p className="ml-2 mt-4 text-sm">
            Code タブで編集されているため変更できません。
          </p>
        )}
      </>
    );
  } else {
    return <></>;
  }
}
