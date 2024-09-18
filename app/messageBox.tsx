import { CenterBox } from "./common/box";
import { Key } from "./common/key";

interface MessageProps {
  isTouch: boolean;
}
export function ReadyMessage(props: MessageProps) {
  if (props.isTouch) {
    return (
      <CenterBox>
        <p>Tap the video to start!</p>
      </CenterBox>
    );
  } else {
    return (
      <CenterBox>
        <p>
          Press
          <Key className="p-1.5 m-2">Space</Key>
          to start!
        </p>
      </CenterBox>
    );
  }
}
export function StopMessage(props: MessageProps) {
  if (props.isTouch) {
    return (
      <CenterBox>
        <p className="mb-1">&lt;Stopped&gt;</p>
        <p>Tap the video to start again.</p>
      </CenterBox>
    );
  } else {
    return (
      <CenterBox>
        <p className="mb-3">&lt;Stopped&gt;</p>
        <p className="">
          Press
          <Key className="p-1.5 m-2">Space</Key>
          to start again.
        </p>
      </CenterBox>
    );
  }
}
