import { metaDataTitle } from "@/common/title.js";
import { tabTitles } from "../const.js";
import { ReactNode } from "react";

export const metadata = metaDataTitle(tabTitles[2]);

export default function Page(props: { children: ReactNode[] }) {
  return props.children;
}
