import { CenterBox } from "@/common/box";
import { ThemeProvider } from "@/common/theme";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { PolyfillProvider } from "./polyfills";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations("en", "error");
  return initMetadata(params, null, "Not Found", `404: ${t("api.notFound")}`);
}

export default async function NotFoundPage() {
  const t = await getTranslations("en", "error");
  return (
    <html>
      <body className="w-full h-dvh overflow-hidden touch-none ">
        <PolyfillProvider>
          <ThemeProvider>
            <CenterBox>404: {t("api.notFound")}</CenterBox>
          </ThemeProvider>
        </PolyfillProvider>
      </body>
    </html>
  );
}
