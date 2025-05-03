import { CenterBox } from "@/common/box";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(
    params,
    null,
    "PLACEHOLDER_TITLE",
    "PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE",
  );
}

export default function NotFoundPage() {
  return (
    <main className="w-full h-dvh">
      <CenterBox>PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE</CenterBox>
    </main>
  );
}
