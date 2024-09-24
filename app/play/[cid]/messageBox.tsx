import { CenterBox } from "@/common/box";
import Button from "@/common/button";
import { Key } from "@/common/key";

interface MessageProps {
  isTouch: boolean;
  start: () => void;
  exit: () => void;
}
export function ReadyMessage(props: MessageProps) {
  return (
    <CenterBox>
      <p className="mb-1">Ready to start!</p>
      <p>
        <Button text="スタート" keyName="Space" onClick={() => props.start()} />
        <Button text="やめる" keyName="Esc" onClick={() => props.exit()} />
      </p>
      <p className="mt-2">
        (スタートされない場合はページを再読み込みしてください)
      </p>
    </CenterBox>
  );
}
export function StopMessage(props: MessageProps) {
  return (
    <CenterBox>
      <p className="mb-1">&lt;Stopped&gt;</p>
      <p>
        <Button
          text="再スタート"
          keyName="Space"
          onClick={() => props.start()}
        />
        <Button text="やめる" keyName="Esc" onClick={() => props.exit()} />
      </p>
    </CenterBox>
  );
}
