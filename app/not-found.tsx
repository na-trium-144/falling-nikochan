import { NotFound } from "./common/box";
import { metaDataTitle } from "./layout";

export const metadata = metaDataTitle(`Not Found`);

export default function NotFoundPage() {
  return <NotFound />;
}
