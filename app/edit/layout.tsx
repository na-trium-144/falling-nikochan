import { metaDataTitle } from "@/common/title";
import { ReactNode } from "react";

export const metadata = metaDataTitle("譜面編集");

export default function Page(props: { children: ReactNode[] }) {
  return props.children;
}
