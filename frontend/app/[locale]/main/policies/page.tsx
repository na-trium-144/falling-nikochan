import { IndexMain } from "../main.js";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { getTranslations, importPoliciesMDX } from "@falling-nikochan/i18n";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.policies");
  return initMetadata(params, "/main/policies", t("title"), "");
}

export default async function PolicyTab({ params }: MetadataProps) {
  const locale = (await params).locale;
  const Policies = await importPoliciesMDX(locale);
  const t = await getTranslations(params, "main.policies");
  return (
    <IndexMain title={t("title")} tabKey="policies" mobileTabKey="links" locale={locale}>
      <div className="text-justify">
        <Policies />
      </div>
    </IndexMain>
  );
}
