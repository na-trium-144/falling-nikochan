"use client";

import clsx from "clsx/lite";
import { PlayOption } from "./playOption.js";
import {
  ChartBrief,
  RecordGetSummary,
  ResultParams,
  deserializeResultParams,
  isVerificationRequired,
  parseResultParams,
  RecordGetSummarySchema,
} from "@falling-nikochan/chart";
import { useEffect, useRef, useState } from "react";
import { FlexYouTube, YouTubePlayer } from "@/common/youtube.js";
import ArrowLeft from "@icon-park/react/lib/icons/ArrowLeft.js";
import International from "@icon-park/react/lib/icons/International.js";
import { useTranslations } from "next-intl";
import { useShareLink } from "@/common/shareLinkAndImage.js";
import { SharedResultBox } from "./sharedResult.js";
import { useColorThief } from "@/common/colorThief.js";
import { ExternalLink } from "@/common/extLink.jsx";
import { ButtonHighlight } from "@/common/button.jsx";
import {
  captureAndWrap,
  fetchBackend,
  formatErrorMsg,
} from "@/common/fetch.js";
import * as v from "valibot";
import {
  APIError,
  markAsExpected,
  shouldHideStatus,
} from "@/common/apiError.js";
import {
  briefIsStale,
  briefStaleKey,
  fetchBrief,
} from "@/common/briefCache.js";
import {
  ClientErrorTitle,
  ErrorMessage,
  LinksOnError,
} from "@/common/errorPageComponent.js";
import { titleShare } from "@/common/title.js";
import { etagContentRegex } from "@/common/briefCache.js";

const YtMetaSchema = () =>
  v.object({
    title: v.string(),
    channelTitle: v.string(),
  });
type YtMeta = v.InferOutput<ReturnType<typeof YtMetaSchema>>;

const dummyBrief = {
  title: "placeholder",
  composer: "placeholder",
  chartCreator: "placeholder",
  ytId: "",
  updatedAt: 0,
  published: true,
  locale: "ja",
  levels: [
    {
      name: "placeholder",
      hash: "",
      type: "Single" as const,
      difficulty: 10,
      noteCount: 100,
      bpmMin: 1,
      bpmMax: 999,
      length: 1,
      unlisted: false,
    },
  ],
};
export function ShareBoxFromSSR(props: { locale: string }) {
  const t = useTranslations("share");
  const te = useTranslations("error");
  const { locale } = props;
  const [cid, setCId] = useState<string>("");
  // const { res, brief } = await getBrief(cid, true);
  const [brief, setBrief] = useState<(ChartBrief & { etag: string }) | null>(
    null
  );
  const [record, setRecord] = useState<RecordGetSummary[] | Error | null>(null);
  const [sharedResult, setSharedResult] = useState<
    ResultParams | string | null
  >(null);
  const [sharedResultVerified, setSharedResultVerified] = useState<
    true | Error | null
  >(null);

  useEffect(() => {
    const cid = window.location.pathname.split("/").pop()!;
    setCId(cid);
    const searchParams = new URLSearchParams(window.location.search);
    let brief: ChartBrief;
    let etag: string;
    if (process.env.NODE_ENV === "development") {
      brief = dummyBrief;
      etag = "";
    } else {
      brief = JSON.parse(
        document
          .querySelector('meta[name="nikochanSharingBrief"]')!
          .getAttribute("content")!
      );
      etag =
        document
          .querySelector('meta[name="nikochanSharingETag"]')!
          .getAttribute("content")
          ?.match(etagContentRegex)?.[0] ?? "";
    }
    setBrief({ ...brief, etag });
    document.title = titleShare(t, cid, brief);
    const titleUpdate = setInterval(() => {
      // Next.jsが元のタイトルに戻してしまう場合があるので、再度上書き
      if (document.title !== titleShare(t, cid, brief)) {
        document.title = titleShare(t, cid, brief);
      }
    }, 100);
    setRecord(null);
    fetchBackend()
      .get(`/api/record/${cid}`)
      .json((record) => v.parse(v.array(RecordGetSummarySchema()), record))
      .catch((e: unknown) => captureAndWrap(e, { cid }))
      .then((record) => setRecord(record));
    if (searchParams.get("result")) {
      (async () => {
        try {
          const qResult = searchParams.get("result")!;
          const { result } = await parseResultParams(qResult);
          const resultParams = deserializeResultParams(result);
          setSharedResult(resultParams);
          setSharedResultVerified(null);
          if (isVerificationRequired(resultParams)) {
            fetchBackend()
              .url(`/api/resultSigning/verify/${cid}`)
              .query({ result: qResult })
              .get()
              .error(422, markAsExpected)
              .res(() => setSharedResultVerified(true))
              .catch((e: unknown) => {
                setSharedResultVerified(captureAndWrap(e));
              });
          }
        } catch (e) {
          console.error(e);
          setSharedResult(te("api.invalidResultParam"));
        }
      })();
    }
    return () => clearInterval(titleUpdate);
  }, [t, te]);

  return (
    <ShareBox
      cid={cid}
      brief={brief}
      record={record}
      sharedResult={sharedResult}
      sharedResultVerified={sharedResultVerified}
      locale={locale}
      forceShowCId
    />
  );
}

interface Props {
  cid: string | undefined;
  brief: (ChartBrief & { etag: string }) | Error | null;
  record: RecordGetSummary[] | Error | null;
  sharedResult?: ResultParams | string | null;
  sharedResultVerified?: true | Error | null;
  locale: string;
  backButton?: () => void;
  forceShowCId?: boolean; // 通常はPCでは表示、モバイルでは非表示だが、trueの場合モバイルでも表示する
}
export function ShareBox(props: Props) {
  const t = useTranslations("share");
  const te = useTranslations("error");
  const {
    cid,
    brief: propBrief,
    sharedResult,
    sharedResultVerified,
    locale,
  } = props;

  const [refreshedBrief, setRefreshedBrief] = useState<
    (ChartBrief & { etag: string }) | Error | null
  >(null);
  const brief = refreshedBrief ?? propBrief;
  useEffect(() => {
    const update = () => {
      if (cid && briefIsStale(cid)) {
        fetchBrief(cid, {
          onResult: (brief) => {
            setRefreshedBrief(brief);
          },
          onError: (e) => setRefreshedBrief(e),
        });
      } else {
        setRefreshedBrief(null);
      }
    };
    const storageUpdate = (e: StorageEvent) => {
      if (cid && e.key === briefStaleKey(cid)) {
        update();
      }
    };
    update();
    // TODO: ページ間でのlocalStorageの同期のために shareBox, theme, recentを読み込む2箇所, bestScoreを読み込む3箇所 で似たようなコードを書いているが、統一したい。
    window.addEventListener("storage", storageUpdate);
    window.addEventListener("visibilitychange", update); // 別タブからもどってきたとき
    window.addEventListener("popstate", update); // router.push()からもどってきたとき
    return () => {
      window.removeEventListener("storage", storageUpdate);
      window.removeEventListener("visibilitychange", update);
      window.removeEventListener("popstate", update);
    };
  }, [cid]);

  const [updatedAt, setUpdatedAt] = useState<string>("");

  useEffect(() => {
    if (brief && !(brief instanceof Error)) {
      setUpdatedAt(new Date(brief.updatedAt).toLocaleDateString());
    }
  }, [brief]);

  const ytPlayer = useRef<YouTubePlayer>(undefined);
  const shareLink = useShareLink(
    cid,
    brief instanceof Error ? undefined : brief,
    locale
  );
  const colorThief = useColorThief();

  const [ytMeta, setYtMeta] = useState<YtMeta | null>(null);
  useEffect(() => {
    if (cid) {
      fetchBackend()
        .url(`/api/ytMeta/${cid}`)
        .query({ lang: locale })
        .get()
        .notFound((e) => markAsExpected(e))
        .error(424, (e) => markAsExpected(e))
        .json((res) => setYtMeta(v.parse(YtMetaSchema(), res)))
        .catch((e) => {
          captureAndWrap(e, { cid });
          setYtMeta(null);
        });
    } else {
      setYtMeta(null);
    }
  }, [cid, locale]);

  if (brief instanceof Error) {
    return (
      <div className="flex flex-col items-center text-center">
        <div
          className={clsx("mb-2 self-start", props.forceShowCId || "no-mobile")}
        >
          {props.backButton && (
            <button
              className={clsx("fn-icon-button", "mr-4")}
              onClick={props.backButton}
            >
              <ButtonHighlight />
              <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
            </button>
          )}
          {cid && (
            <>
              <span>ID:</span>
              <span className="ml-2 text-lg">{cid}</span>
            </>
          )}
        </div>
        {brief instanceof APIError ? (
          <>
            {!shouldHideStatus(brief.status) && (
              <h4 className="fn-heading-box">Error {brief.status}</h4>
            )}
            <p className="mb-3">{formatErrorMsg(brief, te)}</p>
          </>
        ) : (
          <>
            <ClientErrorTitle />
            <ErrorMessage error={brief} />
          </>
        )}
        <LinksOnError
          dependOnStatus={brief instanceof APIError ? brief.status : undefined}
          error={brief}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          "flex flex-col",
          "main-wide:flex-row-reverse main-wide:items-end"
        )}
      >
        <div
          className={clsx(
            "w-full shrink-0 main-wide:w-80",
            "p-2 rounded-sq-lg",
            ytMeta &&
              colorThief.ready &&
              "rounded-br-none main-wide:rounded-br-sq-lg main-wide:rounded-bl-none",
            "relative",
            colorThief.boxStyle
          )}
          style={{ color: colorThief.currentColor }}
        >
          <span className={"fn-glass-1"} />
          <span className={"fn-glass-2"} />
          <FlexYouTube
            fixedSide="width"
            className="w-full"
            id={brief?.ytId}
            control={true}
            ytPlayer={ytPlayer}
          />
          {brief?.ytId && (
            <img
              ref={colorThief.imgRef}
              className="hidden"
              src={`https://i.ytimg.com/vi/${brief?.ytId}/mqdefault.jpg`}
              crossOrigin="anonymous"
            />
          )}
        </div>
        <div className="main-wide:flex-1 main-wide:self-stretch min-w-0 flex flex-col items-start">
          <div className="w-full h-full flex flex-col main-wide:flex-col-reverse items-start overflow-hidden">
            <div
              className={clsx(
                "self-end w-max max-w-full pl-3",
                "mb-2 main-wide:mb-0 main-wide:mt-2",
                "text-right leading-0"
              )}
            >
              <div
                className={clsx(
                  "px-2 pb-1 main-wide:pt-1 w-max max-w-full",
                  "rounded-b-sq-xl main-wide:rounded-l-sq-xl main-wide:rounded-r-none",
                  "relative",
                  colorThief.boxStyle,
                  !(ytMeta && colorThief.ready) &&
                    "-translate-y-full main-wide:translate-y-0 main-wide:translate-x-full",
                  "transition-transform duration-500 ease-out"
                )}
                style={{ color: colorThief.currentColor }}
              >
                <span
                  className={clsx(
                    "fn-glass-1",
                    "border-t-0 main-wide:border-t main-wide:border-r-0"
                  )}
                />
                <span
                  className={clsx(
                    "fn-glass-2",
                    "border-t-0 main-wide:border-t main-wide:border-r-0"
                  )}
                />
                <ExternalLink
                  className={clsx(
                    "max-w-full text-sm main-wide:text-base font-title",
                    "overflow-hidden whitespace-nowrap text-ellipsis"
                  )}
                  href={`https://www.youtube.com/watch?v=${brief?.ytId}`}
                >
                  {ytMeta?.title}
                </ExternalLink>
                <p
                  className={clsx(
                    "font-title text-xs main-wide:text-sm",
                    "overflow-hidden whitespace-nowrap text-ellipsis",
                    "fg-base"
                  )}
                >
                  {ytMeta?.channelTitle}
                </p>
              </div>
            </div>
            <div className="flex-1" />
            <div>
              <div className={clsx("mb-2", props.forceShowCId || "no-mobile")}>
                {props.backButton && (
                  <button
                    className={clsx("fn-icon-button", "mr-4")}
                    onClick={props.backButton}
                  >
                    <ButtonHighlight />
                    <ArrowLeft className="inline-block w-max align-middle text-base m-auto " />
                  </button>
                )}
                {cid && (
                  <>
                    <span>ID:</span>
                    <span className="ml-2 text-lg">{cid}</span>
                  </>
                )}
              </div>
              <p
                className={clsx(
                  "font-title text-2xl min-h-8 font-semibold",
                  "fg-bright"
                )}
              >
                {brief?.title}
              </p>
              <p
                className={clsx(
                  "font-title text-lg min-h-7 font-medium",
                  "fg-bright"
                )}
              >
                {brief?.composer}
              </p>
              <p className="mt-1 min-h-7">
                <span className="inline-block">
                  <span className="text-sm">
                    {brief && `${t("chartCreator")}:`}
                  </span>
                  <span
                    className={clsx("ml-2 font-title text-lg", "fg-bright")}
                  >
                    {brief?.chartCreator}
                  </span>
                </span>
                <span className="inline-block ml-3">
                  <span className="inline-block">
                    {updatedAt && `(${updatedAt})`}
                  </span>
                  <span>
                    {brief?.published ? (
                      <span className="ml-2">
                        <International className="inline-block w-5 translate-y-0.5" />
                        <span>{t("isPublished")}</span>
                      </span>
                    ) : (
                      <>
                        {/*
              <LinkTwo className="inline-block w-5 translate-y-0.5" />
              <span></span>
            */}
                      </>
                    )}
                  </span>
                  {/*<span className="ml-2">
                <PlayOne
                  className="inline-block w-5 translate-y-0.5"
                  theme="filled"
                />
                <span>{brief.playCount || 0}</span>
              </span>*/}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      {sharedResult && (
        <SharedResultBox
          result={sharedResult}
          verified={sharedResultVerified}
        />
      )}
      <p className="mt-2">
        <span className="no-mobile mr-2">{t("shareLink")}:</span>
        <a
          className={clsx("inline-block py-2", "fn-link-1")}
          href={shareLink.path}
          onClick={(e) => e.preventDefault()}
        >
          <span className="no-pc">{t("shareLink")}</span>
          <span className="no-mobile">{shareLink.url}</span>
        </a>
        <span className="inline-block ml-2">{shareLink.buttons}</span>
      </p>
      <PlayOption
        cid={cid}
        brief={brief}
        record={props.record}
        locale={props.locale}
      />
    </>
  );
}
