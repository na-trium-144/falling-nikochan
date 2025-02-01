import { metaDataTitle } from "@/common/title";

export const metadata = metaDataTitle("PLACEHOLDER_TITLE");
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default function Page(props: { children: ReactNode[] }) {
  return props.children;
}
