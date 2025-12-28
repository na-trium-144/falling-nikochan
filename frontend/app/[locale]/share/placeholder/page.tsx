import ShareChart from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(
    params,
    "/share/placeholder",
    "PLACEHOLDER_TITLE",
    "PLACEHOLDER_DESCRIPTION",
    {
      image: "https://placeholder_og_image/",
      noAlternate: true,
      alternateTypes: {
        "application/json+oembed": "https://placeholder_oembed/json",
        "text/xml+oembed": "https://placeholder_oembed/xml",
      },
      custom: { nikochanSharingBrief: "PLACEHOLDER_BRIEF" },
    }
  );
}
// pageTitle(cid, brief) or `Not Found (ID: ${cid})`

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  return <ShareChart locale={locale} />;
}
