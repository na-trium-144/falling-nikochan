import ShareChart from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/share/placeholder", "PLACEHOLDER_TITLE", {
    image: "https://placeholder_og_image/",
    noAlternate: true,
    description: "PLACEHOLDER_DESCRIPTION",
    custom: { nikochanSharingBrief: "PLACEHOLDER_BRIEF" },
  });
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page({ params }: MetadataProps) {
  return <ShareChart locale={(await params).locale} />;
}
