import { Error } from "@/common/box.js";
import { metaDataTitle } from "@/common/title.js";

export const metadata = metaDataTitle(`PLACEHOLDER_TITLE`);

export default function NotFoundPage() {
  return <Error status="PLACEHOLDER_STATUS" message="PLACEHOLDER_MESSAGE" />;;
}
