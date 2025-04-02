import TopPage from "./clientPage.js";
import { AboutContent1 } from "./main/about/[aboutIndex]/1-about.jsx";
import { AboutContent2 } from "./main/about/[aboutIndex]/2-play.jsx";
import { AboutContent3 } from "./main/about/[aboutIndex]/3-edit.jsx";
import { AboutContent4 } from "./main/about/[aboutIndex]/4-level.jsx";
import { AboutContent5 } from "./main/about/[aboutIndex]/5-judge.jsx";
import { MetadataProps } from "./metadata.js";

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  return (
    <TopPage
      locale={locale}
      aboutContents={[
        null,
        <AboutContent1 key={1} locale={locale} />,
        <AboutContent2 key={2} />,
        <AboutContent3 key={3} />,
        <AboutContent4 key={4} locale={locale} />,
        <AboutContent5 key={5} locale={locale} />,
      ]}
    />
  );
}
