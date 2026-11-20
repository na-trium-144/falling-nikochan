"use client";

import clsx from "clsx/lite";
import { titleShare, titleWithSiteName } from "@/common/title";
import {
  ChartBrief,
  RecordGetSummary,
  RecordGetSummarySchema,
} from "@falling-nikochan/chart";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "@/intlProvider";
import { fetchBrief } from "@/common/briefCache";
import { Box } from "@/common/box";
import { ShareBox } from "@/share/placeholder/shareBox";
import { useParams, useRouter } from "next/navigation";
import { useDelayedDisplayState } from "./delayedDisplayState";
import { historyBackWithReview } from "./pwaInstall";
import { captureAndWrap, fetchBackend } from "./fetch";
import * as v from "valibot";
import { createPortal } from "react-dom";

interface SharePageModalState {
  openModal: (cid: string) => void;
  openShareInternal: (cid: string) => void;
}
const SharePageModalContext = createContext<SharePageModalState | null>(null);
export function useSharePageModal() {
  const c = useContext(SharePageModalContext);
  if (!c) {
    throw new Error(
      "useSharePageModal is used outside of SharePageModalProvider"
    );
  }
  return c;
}

export function SharePageModalProvider(props: {
  children: ReactNode;
  from: "top" | "play";
  noResetTitle?: boolean;
}) {
  const { locale } = useParams<{ locale: string }>();
  const th = useTranslations("share");
  const tp = useTranslations("main.play");
  const [modalCId, setModalCId] = useState<string | null>(null);
  const [modalBrief, setModalBrief] = useState<
    (ChartBrief & { etag: string }) | Error | null
  >(null);
  const [modalRecord, setModalRecord] = useState<
    RecordGetSummary[] | Error | null
  >(null);
  const [modalOpened, modalAppearing, setModalOpened] =
    useDelayedDisplayState(200);
  const router = useRouter();
  const openModal = useCallback(
    (cid: string) => {
      if (modalCId !== null) {
        console.warn(
          `openModal called with cid=${cid} while modal ${modalCId} is already open, ignoring`
        );
        return;
      }
      if (window.location.pathname !== `/share/${cid}`) {
        // pushStateではpopstateイベントは発生しない
        window.history.pushState(null, "", `/share/${cid}`);
      }
      setModalBrief(null);
      setModalCId(cid);
      // document.title = titleShare(th, cid);
      fetchBrief(cid, {
        onResult: (brief) => {
          setModalBrief(brief);
          document.title = titleShare(th, cid, brief);
        },
        onError: (e) => setModalBrief(e),
      });
      setModalRecord(null);
      fetchBackend()
        .get(`/api/record/${cid}`)
        .json((record) => v.parse(v.array(RecordGetSummarySchema()), record))
        .catch((e: unknown) => captureAndWrap(e, { cid }))
        .then((record) => setModalRecord(record));
      setModalOpened(true);
    },
    [th, setModalOpened, modalCId]
  );
  const openShareInternal = useCallback(
    (cid: string) => {
      router.push(
        `/${locale}/main/shareInternal` +
          `?cid=${cid}&fromPlay=${props.from === "play" ? "1" : ""}`
      );
    },
    [locale, props.from, router]
  );

  // modalのcloseと、exclusiveModeのリセットは window.history.back(); でpopstateイベントを呼び出しその中で行われる
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname.startsWith("/share/")) {
        const cid = window.location.pathname.slice(7);
        openModal(cid);
      } else {
        setModalOpened(false, () => {
          setModalCId(null);
          setModalBrief(null);
        });
        if (!props.noResetTitle) {
          switch (props.from) {
            case "play":
              document.title = titleWithSiteName(tp("title"));
              break;
            case "top":
              document.title = titleWithSiteName("");
              break;
          }
        }
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [openModal, props.from, tp, props.noResetTitle, setModalOpened]);

  return (
    <SharePageModalContext.Provider value={{ openModal, openShareInternal }}>
      {props.children}
      {modalOpened &&
        createPortal(
          <div
            className={clsx(
              "fn-modal-bg",
              "transition-opacity duration-200",
              modalAppearing ? "ease-in opacity-100" : "ease-out opacity-0"
            )}
            onClick={() => {
              historyBackWithReview();
            }}
          >
            <div className="absolute inset-x-24 inset-y-16 grid-centering">
              <Box
                onClick={(e) => e.stopPropagation()}
                classNameOuter={clsx(
                  "w-max h-max max-w-full max-h-full",
                  "shadow-modal",
                  "transition-transform duration-200 origin-center",
                  modalAppearing ? "ease-in scale-100" : "ease-out scale-0"
                )}
                classNameInner={clsx("flex flex-col max-w-main")}
                scrollableY
                padding={6}
              >
                <ShareBox
                  cid={modalCId || ""}
                  brief={modalBrief}
                  record={modalRecord}
                  locale={locale}
                  backButton={() => {
                    historyBackWithReview();
                  }}
                />
              </Box>
            </div>
          </div>,
          document.body
        )}
    </SharePageModalContext.Provider>
  );
}
