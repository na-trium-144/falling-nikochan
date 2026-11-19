import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import {
  ContactFormLink,
  DeferredEMail,
  GitHubLink,
  XLink,
} from "./common/contactLinks.js";
import { FestivalLink } from "./common/festival.js";
import { PCHeader2 } from "./common/header.js";
import { SharePageModalProvider } from "./common/sharePageModal.jsx";
import { MetadataProps } from "./metadata.js";
import { TopSearchBox, WithTopDemo } from "./topDemo.js";
import Link from "next/link.js";
import { ButtonHighlight } from "./common/button.js";
import { RedirectedWarning } from "./common/redirectedWarning.js";
import { PWAInstallMain } from "./common/pwaInstall.js";
import { StatsDisplay } from "./common/stats.js";
import { Box } from "./common/box.js";

import { popularDays } from "@falling-nikochan/chart";
import { ChartList } from "./main/chartList.js";
import { SocialLinks } from "./common/social.js";
import { MobileFooter } from "./common/footer.js";
import { ArrowRightIcon, PlayOneIcon } from "./common/mdxIcons.js";
import { LazyImg } from "./common/lazyImage.js";
import { YouTubeLogo } from "./common/youtubeLogo.js";
import { SmallDomainShare } from "./common/small.js";
import { ExternalLink } from "./common/extLink.js";

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const t = await getTranslations(locale, "main");
  return (
    <SharePageModalProvider locale={locale} from="top">
      <main className="fn-body-scrollable flex flex-col items-center relative">
        <PCHeader2
          className="fixed top-0 right-0"
          locale={locale}
          backdropBlur
        />
        <WithTopDemo>
          <FestivalLink large />
          <h1 className="text-4xl min-[64rem]:text-6xl min-[82rem]:text-8xl semibold-by-stroke">
            Falling Nikochan
          </h1>
          <p className="text-xl min-[64rem]:text-2xl min-[82rem]:text-3xl">
            {t("description")}
          </p>
          <Link
            href={`/${locale}/main/play`}
            className="fn-button fn-cta2 demo-wide:hidden"
            prefetch={process.env.PREFETCH as "auto"}
          >
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            {t("playNow")}
          </Link>
          <Link
            href={`/${locale}/main/play`}
            className="fn-button fn-cta hidden demo-wide:inline-flex"
            prefetch={process.env.PREFETCH as "auto"}
          >
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            {t("playNow")}
          </Link>
          <TopSearchBox locale={locale} />
          <RedirectedWarning />
          <PWAInstallMain />
        </WithTopDemo>

        <StatsDisplay />

        <div
          id="popular"
          className="w-full max-w-main px-sai-3 mb-8 main-wide:px-sai-6 main-wide:mb-12"
        >
          <Box
            classNameOuter="w-full text-center"
            classNameInner="flex flex-col items-center"
            padding={6}
          >
            <h2 className="relative mb-4 w-full pb-6 main-wide:pb-0">
              <span className="fn-heading-sect text-3xl">{t("popular")}</span>
              <span className="absolute bottom-0 right-4 text-sm main-wide:text-base">
                (
                <PlayOneIcon />
                <span className="mx-0.5">{t("playCount")}:</span>
                {t("playCount3Days", { popularDays })}
                <span className="mx-0.5">/</span>
                {t("playCountTotal")})
              </span>
            </h2>
            <ChartList
              classNameOuter="no-mobile"
              type="popular"
              creator
              useSharePageModal
              showLoading
              badge
              fixedRows={6}
              showCount
              big="v"
            />
            <ChartList
              classNameOuter="no-pc"
              type="popular"
              creator
              useSharePageModal
              showLoading
              badge
              fixedRows={6}
              showCount
            />
            <Link
              href={`/${locale}/main/play?sort=popular`}
              className="fn-button fn-cta2 mt-2"
              prefetch={process.env.PREFETCH as "auto"}
            >
              <span className="fn-glass-1" />
              <span className="fn-glass-2" />
              <ButtonHighlight />
              {t("popularMore")}
            </Link>
          </Box>
        </div>

        <Features locale={locale} />
        <SocialLinks />
        <div className="w-full px-sai">
          <hr className="fn-hr" />
        </div>
        <PoliciesAndLinks locale={locale} />

        <div className="flex-none basis-mobile-footer no-pc" />
        <MobileFooter fixed locale={locale} tabKey="top" />
      </main>
    </SharePageModalProvider>
  );
}

export async function Features({ locale }: { locale: string }) {
  const t = await getTranslations(locale, "main");
  return (
    <>
      <section id="feature-play" className="fn-feature mb-8 main-wide:mb-12">
        <div>
          <h2 className="fn-heading-sect text-3xl">{t("howToPlay.title")}</h2>
          <div className="space-y-2">
            <p>{t("howToPlay.content1")}</p>
            <p>{t("howToPlay.content3")}</p>
            <p>{t("howToPlay.content5")}</p>
          </div>
          <div className="flex items-center main-wide:items-baseline gap-3">
            <Link
              href={`/${locale}/main/play`}
              className="fn-button fn-cta2"
              prefetch={process.env.PREFETCH as "auto"}
            >
              <span className="fn-glass-1" />
              <span className="fn-glass-2" />
              <ButtonHighlight />
              {t("playNow")}
            </Link>
            <Link
              href={`/${locale}/main/about`}
              className="fn-link-3 space-x-1"
              prefetch={process.env.PREFETCH as "auto"}
            >
              <span>{t("howToPlay.about")}</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
        <Box>
          <LazyImg
            src={
              process.env.ASSET_PREFIX +
              "/assets/lp-play.jpg" +
              process.env.ASSET_LP
            }
            className="absolute bottom-[10%] left-[-1%] w-[70%]"
          />
          <LazyImg
            src={
              process.env.ASSET_PREFIX +
              "/assets/lp-play-mobile.jpg" +
              process.env.ASSET_LP
            }
            className="absolute right-[-4%] top-0 h-[105%] rotate-3 origin-top-right"
          />
        </Box>
      </section>

      <section
        id="feature-edit"
        className="fn-feature fn-reverse mb-8 main-wide:mb-12"
      >
        <div>
          <h2 className="fn-heading-sect text-3xl">{t("howToEdit.title")}</h2>
          <div className="space-y-2">
            <p>{t("howToEdit.content1")}</p>
            <p>
              {t.rich("howToEdit.content2", {
                youtube: (c) => (
                  <span className="relative inline-block px-1 space-x-1">
                    <YouTubeLogo />
                    <span>{c}</span>
                  </span>
                ),
              })}
            </p>
            <p>
              {t.rich("howToEdit.content5", {
                url: () => <SmallDomainShare />,
              })}
            </p>
          </div>
          <Link
            href={`/${locale}/main/edit`}
            className="fn-button fn-cta2"
            prefetch={process.env.PREFETCH as "auto"}
          >
            <span className="fn-glass-1" />
            <span className="fn-glass-2" />
            <ButtonHighlight />
            {t("editNow")}
          </Link>
        </div>
        <Box>
          <LazyImg
            src={
              process.env.ASSET_PREFIX +
              "/assets/lp-edit.jpg" +
              process.env.ASSET_LP
            }
            className="absolute inset-0 w-full h-auto my-auto!"
          />
        </Box>
      </section>
    </>
  );
}

export async function PoliciesAndLinks({
  locale,
  // fes,
}: {
  locale: string;
  // fes?: FesData;
}) {
  const t = await getTranslations(locale, "main");
  return (
    <>
      <section className="fn-policies-and-links mb-8">
        <div>
          <h2 className="fn-heading-sect text-2xl mb-3">
            {t("policies.title")}
          </h2>
          <ul className="list-disc ml-6 mb-2 text-left space-y-1">
            <li>{t("policies.content1")}</li>
            <li>{t("policies.content2")}</li>
            <li>{t("policies.content3")}</li>
          </ul>
          <Link
            href={`/${locale}/main/policies`}
            className="fn-link-3 space-x-1"
            prefetch={process.env.PREFETCH as "auto"}
          >
            <span>{t("policies.title")}</span>
            <ArrowRightIcon />
          </Link>
        </div>
        <div>
          <h2 className="fn-heading-sect text-2xl mb-3">
            {t("links.contactLinks")}
          </h2>
          <ul className="list-disc ml-6 text-left space-y-1">
            <li>
              <ContactFormLink />
            </li>
            {/*<li>
              YouTubeは問い合わせ用リンクではない
              ソーシャルリンクとしてもっと目立つところに置きたいかも?
              <YouTubeLink />
            </li>*/}
            <li>
              <XLink />
            </li>
            <li>
              <GitHubLink />
            </li>
            <li>
              <DeferredEMail />
            </li>
            {/*<li>
              <APIDocsLink />
            </li>*/}
            {/*<li>
              <ExternalLink href="https://utcode.net">
                {t("links.aboutUTCode")}
              </ExternalLink>
            </li>*/}
            {/*fes?.num && (
              <li>
                <FestivalLink {...fes} />
              </li>
            )*/}
          </ul>
        </div>
      </section>
      <div className="px-sai mb-6 main-wide:mb-12 flex flex-col gap-1 main-wide:flex-row items-center justify-center">
        <span>&copy; 2024-2026 na-trium-144</span>
        <span className="no-mobile mx-1">/</span>
        <span>
          Powered by{" "}
          <ExternalLink href="https://utcode.net">ut.code();</ExternalLink>
        </span>
      </div>
    </>
  );
}
