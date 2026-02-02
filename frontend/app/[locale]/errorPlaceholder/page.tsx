import { CenterBox } from "@/common/box";
import { initMetadata, MetadataProps } from "@/metadata.js";
import { GoHomeButton, LinksOnError } from "@/common/errorPageComponent";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(
    params,
    null,
    "PLACEHOLDER_TITLE",
    "PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE"
  );
}

export default async function NotFoundPage() {
  return (
    <CenterBox scrollableY>
      <h4 className="mb-2 text-lg font-semibold font-title">
        Error PLACEHOLDER_STATUS
      </h4>
      <p className="mb-3">PLACEHOLDER_MESSAGE</p>
      <LinksOnError />
      <GoHomeButton />
    </CenterBox>
  );
}
