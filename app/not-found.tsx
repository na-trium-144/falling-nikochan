import { NotFound } from "@/common/box.js";
import { initMetadata, MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, null, "Not Found");
}

export default function NotFoundPage() {
  return (
    <html>
      <body>
        <NotFound />
      </body>
    </html>
  );
}
