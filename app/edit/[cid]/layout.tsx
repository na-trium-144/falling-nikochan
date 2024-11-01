import { metaDataTitle } from "@/common/title";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import { ReactNode } from "react";

export async function generateMetadata(context: { params: Promise<Params> }) {
    return metaDataTitle((await context.params).cid === "new" ? "新規譜面編集" : `譜面編集 (ID: ${(await context.params).cid})`);
}

export default function Page(props: { children: ReactNode[] }) {
    return props.children;
}
