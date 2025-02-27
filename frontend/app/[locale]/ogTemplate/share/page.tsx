import OGTemplate from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "");
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page(/*{ params }: MetadataProps*/) {
  return <OGTemplate />;
}
