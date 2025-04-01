import { titleShare, titleWithSiteName } from "@/common/title";
import { ChartBrief, RecordGetSummary } from "@falling-nikochan/chart";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchBrief } from "@/common/briefCache";
import { Box, modalBg } from "@/common/box";
import { ShareBox } from "@/share/placeholder/shareBox";

export function useShareModal(locale: string) {
  const th = useTranslations("share");
  const t = useTranslations("main.play");
  const [modalCId, setModalCId] = useState<string | null>(null);
  const [modalBrief, setModalBrief] = useState<ChartBrief | null>(null);
  const [modalRecord, setModalRecord] = useState<RecordGetSummary[]>([]);
  const [modalAppearing, setModalAppearing] = useState<boolean>(false);
  const openModal = useCallback(
    (cid: string, brief: ChartBrief | undefined) => {
      if (brief) {
        if (window.location.pathname !== `/share/${cid}`) {
          // pushStateではpopstateイベントは発生しない
          window.history.pushState(null, "", `/share/${cid}`);
        }
        setModalCId(cid);
        setModalBrief(brief);
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
        document.title = titleShare(th, cid, brief);
        setTimeout(() => setModalAppearing(true));
      }
    },
    [th],
  );

  // modalのcloseと、exclusiveModeのリセットは window.history.back(); でpopstateイベントを呼び出しその中で行われる
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname.startsWith("/share/")) {
        const cid = window.location.pathname.slice(7);
        fetchBrief(cid).then((res) => {
          openModal(cid, res.brief);
        });
      } else {
        setModalAppearing(false);
        document.title = titleWithSiteName(t("title"));
        setTimeout(() => {
          setModalCId(null);
          setModalBrief(null);
        }, 200);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [openModal, t]);

  const modal: ReactNode = modalCId && modalBrief && (
    <div
      className={
        modalBg +
        "transition-opacity duration-200 " +
        (modalAppearing ? "ease-in opacity-100 " : "ease-out opacity-0 ")
      }
      onClick={() => window.history.back()}
    >
      <div className="absolute inset-6">
        <Box
          onClick={(e) => e.stopPropagation()}
          className={
            "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
            "p-6 overflow-x-clip overflow-y-auto " +
            "shadow-lg " +
            "transition-transform duration-200 origin-center " +
            (modalAppearing ? "ease-in scale-100 " : "ease-out scale-0 ")
          }
        >
          <ShareBox
            cid={modalCId}
            brief={modalBrief}
            record={modalRecord}
            locale={locale}
            backButton={() => window.history.back()}
          />
        </Box>
      </div>
    </div>
  );

  return { modal, openModal };
}
