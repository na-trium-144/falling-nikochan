import { getTranslations } from "@falling-nikochan/i18n/dynamic.js";
import { DevPage } from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { MobileHeader } from "@/common/header.js";
import { Box } from "@/common/box.js";
import clsx from "clsx/lite";
import { MobileFooter } from "@/common/footer.js";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "dev");
  return initMetadata(params, null, t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale
  const t = await getTranslations(params, "dev");

  return <main className="w-full h-full overflow-clip ">
      <div className="flex flex-col w-full h-full items-center ">
        <MobileHeader className="no-pc">{t("title")}</MobileHeader>
        <div
          className={clsx(
            "flex-1 min-h-0 w-full px-6 main-wide:pt-3 main-wide:px-6",
            "flex items-center justify-center"
          )}
        >
          <Box
            classNameOuter="w-max h-max max-w-full max-h-full"
            classNameInner="space-y-3"
            scrollableY
            padding={6}
          >
            <DevPage />
            </Box>
        </div>
        <div className="flex-none basis-mobile-footer no-pc" />
      </div>
      <MobileFooter fixed locale={locale} tabKey={null} />
    </main>
}
