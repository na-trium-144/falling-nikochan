import { PCHeader2 } from "@/common/header.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { TitleAsLink } from "@/common/titleLogo.js";
import { RedirectedWarning } from "@/common/redirectedWarning.js";
import { Box } from "@/common/box.js";
import { Features, PoliciesAndLinks } from "@/page.js";
import { SocialLinks } from "@/common/social.js";
import { MobileFooter } from "@/common/footer.js";
import { ShareBoxFromSSR } from "./shareBox.js";
import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(
    params,
    "/share/placeholder",
    "PLACEHOLDER_TITLE",
    "PLACEHOLDER_DESCRIPTION",
    {
      image: "https://placeholder_og_image/",
      noAlternate: true,
      alternateTypes: {
        "application/json+oembed": "https://placeholder_oembed/json",
        "text/xml+oembed": "https://placeholder_oembed/xml",
      },
      custom: {
        nikochanSharingBrief: "PLACEHOLDER_BRIEF",
        nikochanSharingETag: "PLACEHOLDER_ETAG",
      },
    }
  );
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  const ChangeLog = await importChangeLogMDX(locale);
  return (
    <main className="fn-body-scrollable flex flex-col items-center relative pt-sai">
      <PCHeader2
        className="fixed top-0 right-0"
        locale={locale}
        backdropBlur
        changeLog={<ChangeLog />}
      />

      <TitleAsLink className="grow-3 shrink-0" locale={locale} />
      <RedirectedWarning className="mx-3 main-wide:mx-6 mb-2" />
      <div className="w-full max-w-main px-sai-3 main-wide:px-sai-6 grid-centering mb-12">
        <Box classNameOuter="w-full main-wide:w-max h-max max-w-full p-6">
          <ShareBoxFromSSR locale={locale} />
        </Box>
      </div>

      <Features locale={locale} />
      <SocialLinks />
      <div className="w-full px-sai">
        <hr className="fn-hr" />
      </div>
      <PoliciesAndLinks locale={locale} />

      <div className="flex-none basis-mobile-footer no-pc" />
      <MobileFooter fixed locale={locale} tabKey={null} />
    </main>
  );
}
