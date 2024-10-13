import { metaDataTitle } from "@/common/title";
import { tabTitles } from "../const";
import { ReactNode } from "react";

export const metadata = metaDataTitle(tabTitles[1]);

export default function Page(props: {children:ReactNode[]}) {
    return props.children;
}
