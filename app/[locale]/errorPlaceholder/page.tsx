import { initMetadata, MetadataProps } from "@/metadata.js";
import { ErrorPage } from "@/common/box.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "PLACEHOLDER_TITLE");
}

export default function NotFoundPage() {
  return (
    <ErrorPage status="PLACEHOLDER_STATUS" message="PLACEHOLDER_MESSAGE" />
  );
}
