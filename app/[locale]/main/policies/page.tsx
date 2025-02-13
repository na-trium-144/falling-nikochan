import { IndexMain } from "../main.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations } from "@/../../i18n/i18n.js";
import PoliciesJa from "@/../../i18n/ja/policies.mdx";
import PoliciesEn from "@/../../i18n/en/policies.mdx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.policies");
  return initMetadata(params, "/main/policies", t("title"));
}

export default async function PolicyTab({ params }: MetadataProps) {
  const locale = (await params).locale;
  return (
    <IndexMain tab={3} locale={locale}>
      <div className="text-justify">
        {locale === "ja" ? (
          <PoliciesJa />
        ) : locale === "en" ? (
          <PoliciesEn />
        ) : (
          (console.error("unsupported locale"), null)
        )}
      </div>
    </IndexMain>
  );
}
