import ShareInternal from "./clientPage.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "", null);
}

export default async function Page({ params }: MetadataProps) {
  return <ShareInternal locale={(await params).locale} />;
}
