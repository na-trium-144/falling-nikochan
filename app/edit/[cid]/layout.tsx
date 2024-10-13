import { metaDataTitle } from "@/common/title";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { ReactNode } from "react";

export function generateMetadata(context: { params: Params }) {
    return metaDataTitle(context.params.cid === "new" ? "新規譜面編集" : `譜面編集 (ID: ${context.params.cid})`);
}

export default function Page(props: { children: ReactNode[] }) {
    return props.children;
}
