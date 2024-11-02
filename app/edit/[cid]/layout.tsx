import { metaDataTitle } from "@/common/title";
import { Params } from "next/dist/server/request/params";
import { ReactNode } from "react";

export async function generateMetadata(context: { params: Promise<Params> }) {
  const cid = (await context.params).cid;
  return metaDataTitle(
    cid === "new" ? "新規譜面編集" : `譜面編集 (ID: ${cid})`
  );
}

export default function Page(props: { children: ReactNode[] }) {
  return props.children;
}
