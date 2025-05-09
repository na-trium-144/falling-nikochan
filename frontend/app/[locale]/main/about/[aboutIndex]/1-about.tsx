import { PWAInstallDesc } from "@/common/pwaInstall";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";

export async function AboutContent1({locale}: {locale:string}) {
  const t = await getTranslations(locale, "about.1");
  return (
    <>
      <div className="mb-4">
        <p>{t("content1")}</p>
        <p>{t("content2")}</p>
      </div>
      <div className="mb-4">
        <p>{t("content3")}</p>
        <p>{t("content4")}</p>
      </div>
      <PWAInstallDesc block />
    </>
  );
}
