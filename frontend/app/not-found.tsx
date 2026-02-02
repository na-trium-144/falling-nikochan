import { CenterBox } from "@/common/box";
import { ThemeProvider } from "@/common/theme";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { IrasutoyaLikeBg } from "@/common/irasutoyaLike";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { GoHomeButton } from "@/common/errorPageComponent";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations("en", "error");
  return initMetadata(params, null, "Not Found", `404: ${t("api.notFound")}`);
}

export default async function NotFoundPage() {
  const t = await getTranslations("en", "error");
  return (
    <html>
      <body className="w-full h-dvh overflow-hidden touch-none ">
        <ThemeProvider>
          <IrasutoyaLikeBg />
          <CenterBox>
            <h4 className="mb-2 text-lg font-semibold font-title">Error 404</h4>
            <p className="mb-3">{t("api.notFound")}</p>
            <GoHomeButton goHome={t("errorPage.goHome")} />
          </CenterBox>
        </ThemeProvider>
      </body>
    </html>
  );
}
