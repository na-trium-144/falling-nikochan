import { CenterBox } from "@/common/box";
import { ThemeHandler } from "@/common/theme";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "PLACEHOLDER_TITLE");
}

export default function NotFoundPage() {
  return (
    <main className="w-full h-dvh">
      <CenterBox>PLACEHOLDER_STATUS: PLACEHOLDER_MESSAGE</CenterBox>
      <ThemeHandler />
    </main>
  );
}
