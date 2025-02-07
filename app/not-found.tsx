import { NotFound } from "@/common/box.js";
import { metaDataTitle } from "@/common/title.js";

export const metadata = metaDataTitle(`Not Found`);

export default function NotFoundPage() {
  return <NotFound />;
}
