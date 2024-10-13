import { metaDataTitle } from "@/layout";
import { tabTitles } from "../const";
import { ReactNode } from "react";

export const metadata = metaDataTitle(tabTitles[2]);

export default function Page(props: {children:ReactNode[]}) {
    return props.children;
}
