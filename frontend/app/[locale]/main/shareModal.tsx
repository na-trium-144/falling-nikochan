import { titleShare, titleWithSiteName } from "@/common/title";
import { ChartBrief, RecordGetSummary } from "@falling-nikochan/chart";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchBrief } from "@/common/briefCache";
import { Box, modalBg } from "@/common/box";
import { ShareBox } from "@/share/placeholder/shareBox";
import { useRouter } from "next/navigation";
import { ShareInternalSession } from "./shareInternal/clientPage";

export function useShareModal(locale: string, from: "play" | "top") {
  const th = useTranslations("share");
  const tp = useTranslations("main.play");
  const [modalCId, setModalCId] = useState<string | null>(null);
  const [modalBrief, setModalBrief] = useState<ChartBrief | null>(null);
  const [modalRecord, setModalRecord] = useState<RecordGetSummary[]>([]);
  const [modalAppearing, setModalAppearing] = useState<boolean>(false);
  const router = useRouter();
  const openModal = useCallback(
    (cid: string) => {
      if (window.location.pathname !== `/share/${cid}`) {
        // pushStateではpopstateイベントは発生しない
        window.history.pushState(null, "", `/share/${cid}`);
      }
      setModalBrief(null);
      setModalCId(cid);
      document.title = titleShare(th, cid);
      fetchBrief(cid).then((res) => {
        if (res.ok) {
          setModalBrief(res.brief!);
          document.title = titleShare(th, cid, res.brief!);
        }
      });
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
      setTimeout(() => setModalAppearing(true));
    },
    [th]
  );
  const openShareInternal = useCallback(
    (cid: string, brief: ChartBrief | undefined) => {
      if (brief) {
        sessionStorage.setItem(
          "shareInternal",
          JSON.stringify({
            cid,
            fromPlay: from === "play",
          } satisfies ShareInternalSession)
        );
        router.push(`/${locale}/main/shareInternal`);
      }
    },
    [locale, from, router]
  );

  // modalのcloseと、exclusiveModeのリセットは window.history.back(); でpopstateイベントを呼び出しその中で行われる
  useEffect(() => {
    const handler = () => {
      if (window.location.pathname.startsWith("/share/")) {
        const cid = window.location.pathname.slice(7);
        openModal(cid);
      } else {
        setModalAppearing(false);
        switch (from) {
          case "play":
            document.title = titleWithSiteName(tp("title"));
            break;
          case "top":
            document.title = titleWithSiteName("");
            break;
        }
        setTimeout(() => {
          setModalCId(null);
          setModalBrief(null);
        }, 200);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [openModal, from, tp]);

  const modal: ReactNode = modalCId && modalBrief && (
    <div
      className={
        modalBg +
        "transition-opacity duration-200 " +
        (modalAppearing ? "ease-in opacity-100 " : "ease-out opacity-0 ")
      }
      onClick={() => window.history.back()}
    >
      <div className="absolute inset-12">
        <Box
          onClick={(e) => e.stopPropagation()}
          className={
            "absolute inset-0 m-auto w-max h-max max-w-full max-h-full " +
            "flex flex-col " +
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

  return { modal, openModal, openShareInternal };
}
