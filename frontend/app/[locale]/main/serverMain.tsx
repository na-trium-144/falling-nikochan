import { importChangeLogMDX } from "@falling-nikochan/i18n/mdx";
import { ChartList, ChartListType } from "./chartList";
import { IndexMain, Props } from "./main";
import { TabKeys } from "@/common/footer";

export async function IndexMainPage(props: Omit<Props, "changeLog">) {
  const ChangeLog = await importChangeLogMDX(props.locale);
  return <IndexMain {...props} changeLog={<ChangeLog />} />;
}

interface PProps {
  locale: string;
  title: string;
  rssButton?: boolean;
  tabKey: TabKeys;
  mobileTabKey: "top" | "play";
  type: ChartListType;
  dateDiff?: boolean;
  badge?: boolean;
}
export async function ChartListPage(props: PProps) {
  return (
    <IndexMainPage
      title={props.title}
      tabKey={props.tabKey}
      mobileTabKey={props.mobileTabKey}
      locale={props.locale}
    >
      <section className="fn-sect">
        <h3 className="no-mobile flex items-center justify-between">
          <span className="fn-heading-sect">{props.title}</span>
          {props.rssButton && (
            <a
              href={process.env.BACKEND_PREFIX + "/rss.xml"}
              target="_blank"
              className="fn-rss-button"
            />
          )}
        </h3>
        <ChartList
          type={props.type}
          creator
          useSharePageModal
          showLoading
          dateDiff={props.dateDiff}
          moreHref={null}
          badge={props.badge}
          inScrollableMainContainer
        />
      </section>
    </IndexMainPage>
  );
}
