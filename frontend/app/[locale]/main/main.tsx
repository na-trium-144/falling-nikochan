import clsx from "clsx/lite";
import { MobileHeader, PCHeader, PCHeader2 } from "@/common/header.js";
import { Box } from "@/common/box.js";
import { MobileFooter, TabKeys } from "@/common/footer.js";
import { ReactNode } from "react";
import { RedirectedWarning } from "@/common/redirectedWarning";
import { ChartList, ChartListType } from "./chartList";
import { BackButton } from "./clientMain";

interface Props {
  classNameInner?: string;
  children?: ReactNode | ReactNode[];
  title: string;
  tabKey: TabKeys; // PC表示でnav内のアクティブなタブ or nullでnavを非表示
  mobileTabKey: TabKeys; // モバイル表示でfooter内のアクティブなタブ
  noBackButtonMobile?: boolean; // モバイル表示で戻るボタンを非表示 (footerから直接開けるページの場合非表示にする)
  noBackButtonPC?: boolean;
  afterBackButtonPC?: ReactNode;
  locale: string;
}
export function IndexMain(props: Props) {
  const locale = props.locale;
  // const t = await getTranslations(locale, "main");

  // できればserver componentにしたいが、shareInternalだけはどうしてもIndexMainをclient componentで呼ぶ必要があるため、
  // どちらからも呼べるようにする
  // そのためにtranslationがここでは使用できない

  return (
    <main className="relative flex flex-col w-full h-full items-center">
      <MobileHeader className="no-pc" noBackButton={props.noBackButtonMobile}>
        {props.title}
      </MobileHeader>
      <PCHeader locale={locale} />
      <PCHeader2 className="absolute top-0 right-0" locale={locale} />
      <RedirectedWarning className="mx-3 main-wide:mx-6 mb-2" />
      <div
        className={clsx(
          "w-full overflow-hidden",
          "shrink-0 basis-0 grow-2",
          "flex flex-row items-stretch justify-center",
          "px-sai-3 main-wide:px-sai-6 main-wide:pb-sai-6"
        )}
      >
        <Box
          // fn-index-main クラスはChartListがスクロールコンテナ基準としてこれを見つけるための指定
          classNameOuter={clsx("min-h-0 basis-main shrink-1 min-w-0")}
          classNameInner={clsx(
            "fn-index-main flex flex-col",
            props.classNameInner
          )}
          scrollableY
          defaultFadeY
          padding={6}
        >
          <div className="flex items-start">
            {!props.noBackButtonPC && <BackButton />}
            {props.afterBackButtonPC}
          </div>
          {props.children}
        </Box>
      </div>
      <MobileFooter locale={locale} tabKey={props.mobileTabKey} />
    </main>
  );
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
export function ChartListPage(props: PProps) {
  return (
    <IndexMain
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
    </IndexMain>
  );
}
