"use client";

import clsx from "clsx/lite";
import { titleShare, titleWithSiteName } from "@/common/title";
import { ChartBrief, RecordGetSummary } from "@falling-nikochan/chart";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { fetchBrief } from "@/common/briefCache";
import { Box } from "@/common/box";
import { ShareBox } from "@/share/placeholder/shareBox";
import { useRouter } from "next/navigation";
import { useDelayedDisplayState } from "./delayedDisplayState";
import { historyBackWithReview } from "./pwaInstall";

interface SharePageModalState {
  openModal: (cid: string) => void;
  openShareInternal: (cid: string, brief?: ChartBrief) => void;
}
const SharePageModalContext = createContext<SharePageModalState>({
  openModal: () => {},
  openShareInternal: () => {},
});
export const useSharePageModal = () => useContext(SharePageModalContext);

export function SharePageModalProvider(props: {
  children: ReactNode;
  locale: string;
  from: "top" | "play";
  noResetTitle?: boolean;
}) {
  const th = useTranslations("share");
  const tp = useTranslations("main.play");
  const [modalCId, setModalCId] = useState<string | null>(null);
  const [modalBrief, setModalBrief] = useState<ChartBrief | null>(null);
  const [modalRecord, setModalRecord] = useState<RecordGetSummary[] | null>(
    null
  );
  const [modalOpened, modalAppearing, setModalOpened] =
    useDelayedDisplayState(200);
  const router = useRouter();
  const openModal = useCallback(
    (cid: string) => {
      if (window.location.pathname !== `/share/${cid}`) {
        // pushStateではpopstateイベントは発生しない
        window.history.pushState(null, "", `/share/${cid}`);
      }
      setModalBrief(null);
      setModalCId(cid);
      // document.title = titleShare(th, cid);
      fetchBrief(cid).then((res) => {
        if (res.ok) {
          setModalBrief(res.brief!);
          document.title = titleShare(th, cid, res.brief!);
        }
      });
      setModalRecord(null);
      fetch(process.env.BACKEND_PREFIX + `/api/record/${cid}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("failed to fetch record");
          }
        })
        .then((record) => setModalRecord(record))
        .catch(() => setModalRecord([]));
      setModalOpened(true);
    },
    [th, setModalOpened]
  );
  const openShareInternal = useCallback(
    (cid: string, brief: ChartBrief | undefined) => {
      if (brief) {
        router.push(
          `/${props.locale}/main/shareInternal` +
            `?cid=${cid}&fromPlay=${props.from === "play" ? "1" : ""}`
        );
      }
    },
    [props.locale, props.from, router]
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
      {modalOpened && (
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
                locale={props.locale}
                backButton={() => {
                  historyBackWithReview();
                }}
              />
            </Box>
          </div>
        </div>
      )}
    </SharePageModalContext.Provider>
  );
}
