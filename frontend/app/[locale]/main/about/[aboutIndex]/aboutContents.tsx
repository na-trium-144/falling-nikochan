import { AboutContent1 } from "./1-about";
import { AboutContent2 } from "./2-play";
import { AboutContent3 } from "./3-edit";
import { AboutContent4 } from "./4-level";
import { AboutContent5 } from "./5-judge";

export const maxAboutPageIndex = 5;

interface Props {
  index: number;
  locale: string;
}
export function AboutContent(props: Props) {
  switch (props.index) {
    case 1:
      return <AboutContent1 />;
    case 2:
      return <AboutContent2 />;
    case 3:
      return <AboutContent3 locale={props.locale} />;
    case 4:
      return <AboutContent4 />;
    case 5:
      return <AboutContent5 />;
    default:
      return null;
  }
}
