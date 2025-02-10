import { getTranslations } from "@/getTranslations";

interface Props {
  locale: string;
}
export async function AboutContent1(props: Props) {
  const t = await getTranslations(props.locale, `about.1`);
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>{t("content1")}</p>
        <p>{t("content2")}</p>
      </div>
      <div className="mb-4 space-y-2">
        <p>{t("content3")}</p>
        <p>{t("content4")}</p>
      </div>
    </>
  );
}
