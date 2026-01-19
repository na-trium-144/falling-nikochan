import Button from "@/common/button.js";
import Input from "@/common/input.js";
import { Key } from "@/common/key.js";
import Mouse from "@icon-park/react/lib/icons/Mouse";
import CheckBox from "@/common/checkBox.js";
import Select from "@/common/select";
import { useTranslations } from "next-intl";
import { HelpIcon } from "@/common/caption";
import { ChartEditing } from "@falling-nikochan/chart";

interface Props {
  chart?: ChartEditing;
}
export default function NoteTab(props: Props) {
  const t = useTranslations("edit.note");
  const { chart } = props;
  const currentLevel = chart?.currentLevel;
  const cur = currentLevel?.current;
  const ss = cur?.signatureState;
  return (
    <div className="flex flex-col h-full">
      <div>
        <span>{t("step")}</span>
        <span className="inline-block text-right w-6">
          {ss && ss.barNum + 1}
        </span>
        <span className="ml-1 ">;</span>
        <span className="inline-block text-right w-6">
          {ss && ss.count.fourth + 1}
        </span>
        <div className="w-20 inline-block">
          {ss && ss.count.numerator > 0 && (
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
          <span>{t("noteNum")}</span>
          <span className="inline-block text-right w-6">
            {currentLevel?.currentNote
              ? currentLevel.current.notesIndexInStep! + 1
              : "-"}
          </span>
          <span className="ml-1 ">/</span>
          <span className="inline-block ml-1">{cur?.notesCountInStep}</span>
        </div>
        <div className="inline-block">
          <Button
            keyName="N"
            text={t("noteAdd")}
            onClick={() => chart?.pasteNote(0)}
            disabled={!currentLevel?.canAddNote}
          />
          {currentLevel?.currentNote && (
            <Button
              text={t("noteDelete")}
              onClick={() => currentLevel?.deleteNote()}
              disabled={!currentLevel?.currentNoteEditable}
            />
          )}
        </div>
      </div>
      <div className="mb-1">
        <span>{t("totalNotes")}:</span>
        <span className="inline-block w-12 text-right">
          {currentLevel?.currentNote ? cur!.noteIndex! + 1 : "-"}
        </span>
        <span className="mx-1">/</span>
        <span className="">{currentLevel?.freeze.notes.length || 0}</span>
      </div>
      <NoteEdit {...props} />
      <span className="flex-1 mb-4 " />
      <div className="flex flex-row ">
        <CopyPasteButton {...props} />
      </div>
    </div>
  );
}
function CopyPasteButton(props: Props) {
  const { chart } = props;
  const t = useTranslations("edit.note");
  return (
    <>
      <div className="flex flex-col items-stretch">
        <Button
          onClick={() => chart?.pasteNote(0)}
          text={t("paste")}
          keyName="V"
          disabled={!chart?.hasCopyBuf(0)}
        />
        <Button
          onClick={() => chart?.copyNote(0)}
          text={t("copy")}
          keyName="C"
        />
      </div>
      {Array.from(new Array(9)).map((_, i) => (
        <div key={i} className="flex flex-col items-stretch">
          <Button
            onClick={() => chart?.pasteNote(i + 1)}
            keyName={(i + 1).toString()}
            disabled={!chart?.hasCopyBuf(i + 1)}
          />
          <Button
            onClick={() => chart?.copyNote(i + 1)}
            text={(i + 1).toString()}
          />
        </div>
      ))}
    </>
  );
}

function NoteEdit(props: Props) {
  const { chart } = props;
  const currentLevel = chart?.currentLevel;
  // const cur = currentLevel?.current;
  const t = useTranslations("edit.note");
  if (currentLevel?.currentNote) {
    const n = currentLevel?.currentNote;
    const nv = Math.sqrt(Math.pow(n.hitVX, 2) + Math.pow(n.hitVY, 2));
    return (
      <>
        <table className="w-max mb-4">
          <tbody className="text-center">
            <tr>
              <td className="pr-2 ">
                <span>{t("position")}</span>
                <span className="inline-block ml-1">
                  (
                  <span className="inline-block">
                    <Mouse className="" />
                  </span>
                  )
                </span>
                <HelpIcon>
                  {t.rich("positionHelp", { br: () => <br /> })}
                </HelpIcon>
              </td>
              <td>x =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitX.toString()}
                  updateValue={(v) =>
                    currentLevel?.updateNote({
                      ...n,
                      hitX: Number(v),
                    })
                  }
                  isValid={(v) =>
                    v !== "" &&
                    !isNaN(Number(v)) &&
                    Number(v) >= -5 &&
                    Number(v) <= 5
                  }
                  disabled={!currentLevel?.currentNoteEditable}
                />
              </td>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <td className="pr-2">
                <span>{t("velocity")}</span>
                <span className="inline-block ml-1">
                  (<Key className="px-1 py-0.5 mx-0.5 text-sm">Shift</Key>+
                  <span className="inline-block">
                    <Mouse className="" />
                  </span>
                  )
                </span>
                <HelpIcon>
                  <p>{t.rich("velocityHelp1", { br: () => <br /> })}</p>
                  <p className="mt-2">
                    {t.rich("velocityHelp2", { br: () => <br /> })}
                  </p>
                </HelpIcon>
              </td>
              <td>vx =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitVX.toString()}
                  updateValue={(v) =>
                    currentLevel?.updateNote({
                      ...n,
                      hitVX: Number(v),
                    })
                  }
                  isValid={(v) => v !== "" && !isNaN(Number(v))}
                  disabled={!currentLevel?.currentNoteEditable}
                />
              </td>
              <td>,</td>
              <td>vy =</td>
              <td>
                <Input
                  className="w-20"
                  actualValue={n.hitVY.toString()}
                  updateValue={(v) =>
                    currentLevel?.updateNote({
                      ...n,
                      hitVY: Number(v),
                    })
                  }
                  isValid={(v) => v !== "" && !isNaN(Number(v))}
                  disabled={!currentLevel?.currentNoteEditable}
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
                    currentLevel?.updateNote({
                      ...n,
                      hitVX: (Number(v) / nv) * n.hitVX,
                      hitVY: (Number(v) / nv) * n.hitVY,
                    })
                  }
                  isValid={(v) =>
                    v !== "" && !isNaN(Number(v)) && Number(v) > 0
                  }
                  disabled={!currentLevel?.currentNoteEditable}
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
                    currentLevel?.updateNote({
                      ...n,
                      hitVX: nv * Math.cos((Number(v) / 180) * Math.PI),
                      hitVY: nv * Math.sin((Number(v) / 180) * Math.PI),
                    })
                  }
                  isValid={(v) => v !== "" && !isNaN(Number(v)) && nv > 0}
                  disabled={!currentLevel?.currentNoteEditable}
                />
                °
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <CheckBox
            className="ml-2 mr-1"
            value={n.big}
            onChange={(v) => currentLevel?.updateNote({ ...n, big: v })}
            disabled={!currentLevel?.currentNoteEditable}
          >
            <span>{t("big")}</span>
            <Key className="text-xs p-0.5 ml-1 ">B</Key>
          </CheckBox>
        </div>
        <div className="mt-2 ml-2">
          <span>{t("fallMode")}</span>
          <HelpIcon>{t.rich("fallModeHelp", { br: () => <br /> })}</HelpIcon>
          <Select
            value={n.fall}
            options={[
              { label: t("fallModeTrue"), value: true },
              { label: t("fallModeFalse"), value: false },
            ]}
            onSelect={(v: boolean) =>
              currentLevel?.updateNote({ ...n, fall: !!Number(v) })
            }
            disabled={!currentLevel?.currentNoteEditable}
            showValue
          />
        </div>
        {currentLevel?.currentNote && !currentLevel?.currentNoteEditable && (
          <p className="ml-2 mt-4 text-sm">{t("editedInCode")}</p>
        )}
      </>
    );
  } else {
    return <></>;
  }
}
