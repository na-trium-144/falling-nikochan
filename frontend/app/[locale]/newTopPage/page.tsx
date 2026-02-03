import NewTopPage from "./clientPage.js";
import { SharePageModalProvider } from "../common/sharePageModal.jsx";
import { MetadataProps, initMetadata } from "../metadata.js";
import { getTranslations } from "@falling-nikochan/i18n/dynamic";
import { ChartBrief } from "@falling-nikochan/chart";
import briefApp from "@falling-nikochan/route/dist/src/api/brief.js";
import popularApp from "@falling-nikochan/route/dist/src/api/popular.js";
import { ChartLineBrief } from "../main/chartList.jsx";

export async function generateMetadata({ params }: MetadataProps) {
  const t = await getTranslations(params, "main.newTopPage");
  return initMetadata(params, "/newTopPage", t("title"), t("description"));
}

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;

  // Fetch popular charts for showcase
  let popularBriefs: ChartLineBrief[] = [];
  try {
    const popularRes = await popularApp.request("/");
    if (popularRes.ok) {
      const popularData = (await popularRes.json()) as Array<{ cid: string }>;
      const briefPromises = popularData.slice(0, 5).map(async (item) => {
        try {
          const briefRes = await briefApp.request(`/${item.cid}`);
          return {
            cid: item.cid,
            fetched: true,
            brief: (await briefRes.json()) as ChartBrief,
          } satisfies ChartLineBrief;
        } catch (e) {
          if (
            process.env.NODE_ENV === "development" ||
            process.env.ALLOW_FETCH_ERROR
          ) {
            console.error(`Error fetching brief for ${item.cid}:`, e);
            return {
              cid: item.cid,
              fetched: true,
              brief: undefined,
            } satisfies ChartLineBrief;
          } else {
            throw e;
          }
        }
      });
      popularBriefs = await Promise.all(briefPromises);
    }
  } catch (e) {
    console.error("Error fetching popular charts:", e);
  }

  return (
    <SharePageModalProvider locale={locale} from="newTopPage">
      <NewTopPage locale={locale} popularBriefs={popularBriefs} />
    </SharePageModalProvider>
  );
}
