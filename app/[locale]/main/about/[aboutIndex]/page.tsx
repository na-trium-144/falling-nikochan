import { IndexMain } from "@/main/main.js";
import { AboutContent2 } from "./2-play.js";
import { AboutContent1 } from "./1-about.js";
import { AboutContent3 } from "./3-edit.js";
import { Pager } from "@/common/pager.js";
import { AboutContent4 } from "./4-level.js";
import { AboutContent5 } from "./5-judge.js";
import { getTranslations } from "@/getTranslations.js";
import { initMetadata } from "@/metadata.js";

const maxIndex = 5;

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from(new Array(maxIndex)).map((_, i) => ({
    aboutIndex: (i + 1).toString(),
  }));
}

interface Props {
  params: Promise<{ locale: string; aboutIndex: string }>;
}
export async function generateMetadata({ params }: Props) {
  const aboutIndex = (await params).aboutIndex;
  const t = await getTranslations(params, `about.${aboutIndex}`);
  return initMetadata(params, `/main/about/${aboutIndex}`, t("title"));
}

export default async function AboutTab({ params }: Props) {
  const aboutIndex = Number((await params).aboutIndex);
  const locale = (await params).locale;
  const t = await getTranslations(params, `about.${aboutIndex}`);

  return (
    <IndexMain tab={0} locale={locale}>
      <Pager
        index={aboutIndex}
        maxIndex={maxIndex}
        hrefBefore={`/${locale}/main/about/${aboutIndex - 1}`}
        hrefAfter={`/${locale}/main/about/${aboutIndex + 1}`}
        title={t("title")}
      />
      <div className="flex-1 text-center">
        {aboutIndex === 1 ? (
          <AboutContent1 locale={locale} />
        ) : aboutIndex === 2 ? (
          <AboutContent2 />
        ) : aboutIndex === 3 ? (
          <AboutContent3 />
        ) : aboutIndex === 4 ? (
          <AboutContent4 locale={locale} />
        ) : aboutIndex === 5 ? (
          <AboutContent5 locale={locale} />
        ) : (
          <p> Not Found</p>
        )}
      </div>
    </IndexMain>
  );
}
