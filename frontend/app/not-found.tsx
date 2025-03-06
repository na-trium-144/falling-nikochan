import { CenterBox } from "@/common/box";
import { ThemeHandler } from "@/common/theme";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "Not Found");
}

export default async function NotFoundPage() {
  const t = await getTranslations("en", "error");
  return (
    <html>
      <body>
        <main className="w-full h-dvh">
          <CenterBox>404: {t("api.notFound")}</CenterBox>
          <ThemeHandler />
        </main>
      </body>
    </html>
  );
}
