import { NotFound } from "./common/box";
import { metaDataTitle } from "./common/title";

export const metadata = metaDataTitle(`Not Found`);

export default function NotFoundPage() {
  return <NotFound />;
}
