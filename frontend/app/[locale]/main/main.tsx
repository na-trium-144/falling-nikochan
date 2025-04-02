"use client";

import { MobileHeader } from "@/common/header.js";
import { Box } from "@/common/box.js";
import {
  MobileFooter,
  PCFooter,
  pcTabTitleKeys,
  TabKeys,
  tabURLs,
} from "@/common/footer.js";
import { ReactNode } from "react";
import Link from "next/link";
import Title from "@/common/titleLogo.js";
import { linkStyle1 } from "@/common/linkStyle.js";
import { useTranslations } from "next-intl";
import { RedirectedWarning } from "@/common/redirectedWarning";

interface Props {
  children?: ReactNode | ReactNode[];
  title: string;
  tabKey: TabKeys; // PC表示でnav内のアクティブなタブ or nullでnavを非表示
  mobileTabKey: TabKeys; // モバイル表示でfooter内のアクティブなタブ
  noBackButton?: boolean; // モバイル表示で戻るボタンを非表示 (footerから直接開けるページの場合非表示にする)
  locale: string;
  modal?: ReactNode;
}
export function IndexMain(props: Props) {
  const locale = props.locale;
  const t = useTranslations("main");

  return (
    <main className="flex flex-col w-full h-full items-center ">
      {props.modal}
      <MobileHeader noBackButton={props.noBackButton}>
        {props.title}
      </MobileHeader>
      <Link
        href={`/${locale}`}
        className={
          "hidden main-wide:block w-full " +
          "shrink-0 basis-24 relative " +
          linkStyle1
        }
        style={{
          marginLeft: "-20rem",
          marginRight: "-20rem",
        }}
        prefetch={!process.env.NO_PREFETCH}
      >
        <Title className="absolute inset-0 " />
      </Link>
      <RedirectedWarning />
      <div
        className={
          "w-full overflow-hidden " +
          "shrink-0 basis-0 grow-2 " +
          "flex flex-row items-stretch justify-center px-3 main-wide:px-6 "
        }
      >
        {props.tabKey !== null && (
          <nav
            className={
              "hidden main-wide:flex " +
              "flex-col h-max w-64 shrink-0 my-auto " +
              "transition ease-out duration-200 "
            }
          >
            {pcTabTitleKeys.map((key, i) =>
              key === props.tabKey ? (
                <Box
                  key={i}
                  className="text-center rounded-r-none py-3 pl-2 pr-2"
                >
                  {t(key + ".title")}
                </Box>
              ) : (
                <Link
                  key={i}
                  href={`/${locale}${tabURLs[key]}`}
                  className={
                    " text-center hover:bg-sky-200 hover:dark:bg-orange-950 active:shadow-inner " +
                    "rounded-l-lg py-3 pl-2 pr-2 "
                  }
                  prefetch={!process.env.NO_PREFETCH}
                >
                  {t(key + ".title")}
                </Link>
              ),
            )}
          </nav>
        )}
        <Box className={"flex flex-col p-6 overflow-y-auto min-h-0 flex-1 "}>
          {props.children}
        </Box>
      </div>
      <PCFooter locale={locale} nav={props.tabKey === null} />
      <MobileFooter locale={locale} tabKey={props.mobileTabKey} />
    </main>
  );
}
