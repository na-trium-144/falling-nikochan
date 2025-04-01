import ShareChart from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { AboutContent1 } from "@/main/about/[aboutIndex]/1-about.jsx";
import { AboutContent2 } from "@/main/about/[aboutIndex]/2-play.jsx";
import { AboutContent3 } from "@/main/about/[aboutIndex]/3-edit.jsx";
import { AboutContent4 } from "@/main/about/[aboutIndex]/4-level.jsx";
import { AboutContent5 } from "@/main/about/[aboutIndex]/5-judge.jsx";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/share/placeholder", "PLACEHOLDER_TITLE", {
    image: "https://placeholder_og_image/",
    noAlternate: true,
    description: "PLACEHOLDER_DESCRIPTION",
  });
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  return (
    <ShareChart
      locale={locale}
      aboutContents={[
        null,
        <AboutContent1 key={1} />,
        <AboutContent2 key={2} />,
        <AboutContent3 key={3} />,
        <AboutContent4 key={4} locale={locale} />,
        <AboutContent5 key={5} locale={locale} />,
      ]}
    />
  );
}
