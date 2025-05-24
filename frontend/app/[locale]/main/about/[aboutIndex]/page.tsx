import { IndexMain } from "@/main/main.js";
import { AboutContent2 } from "./2-play.js";
import { AboutContent1 } from "./1-about.js";
import { AboutContent3 } from "./3-edit.js";
import { Pager } from "@/common/pager.js";
import { AboutContent4 } from "./4-level.js";
import { AboutContent5 } from "./5-judge.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { initMetadata } from "@/metadata.js";
import { maxAboutPageIndex } from "./pager.js";


export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return Array.from(new Array(maxAboutPageIndex)).map((_, i) => ({
    aboutIndex: (i + 1).toString(),
  }));
}

interface Props {
  params: Promise<{ locale: string; aboutIndex: string }>;
}
export async function generateMetadata({ params }: Props) {
  const aboutIndex = (await params).aboutIndex;
  const t = await getTranslations(params, `about.${aboutIndex}`);
  return initMetadata(params, `/main/about/${aboutIndex}`, t("title"), t("description"));
}

export default async function AboutTab({ params }: Props) {
  const aboutIndex = Number((await params).aboutIndex);
  const locale = (await params).locale;
  const t = await getTranslations(params, `about.${aboutIndex}`);
  const tm = await getTranslations(params, "main.about");

  return (
    <IndexMain
      title={tm("title")}
      tabKey={null}
      mobileTabKey="top"
      locale={locale}
    >
      <Pager
        index={aboutIndex}
        maxIndex={maxAboutPageIndex}
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
          <AboutContent3 locale={locale} />
        ) : aboutIndex === 4 ? (
          <AboutContent4 locale={locale} />
        ) : aboutIndex === 5 ? (
          <AboutContent5 locale={locale} />
        ) : (
          <p>Not Found</p>
        )}
      </div>
    </IndexMain>
  );
}
