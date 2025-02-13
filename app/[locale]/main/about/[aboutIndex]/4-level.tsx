import { levelTypes } from "@/../../chartFormat/chart.js";
import { levelColors } from "@/common/levelColors";
import { getTranslations } from "@/../../i18n/i18n.js";

interface Props {
  locale: string;
}
export async function AboutContent4(props: Props) {
  const t = await getTranslations(props.locale, "about.4");
  return (
    <>
      <div className="mb-4 space-y-2">
        <p>
          {t.rich("content1", {
            level: (c) => <span className={"inline-block ml-0.5 " + levelColors[Number(c)]}>
            <span className="text-sm">{levelTypes[Number(c)]}-</span>
            <span className="">{4 + Number(c) * 4}</span>
          </span>
          })}
        </p>
        <p>
          {t.rich("content2", {
            level: (c) => <span className={"mx-1 " + levelColors[Number(c)]}>
            {levelTypes[Number(c)]}
          </span>
          })}
        </p>
        <p>
        {t("content3")}
        </p>
      </div>
    </>
  );
}
