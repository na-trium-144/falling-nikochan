import { NotFound } from "@/common/box.js";
import { initMetadata, MetadataProps } from "./metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return initMetadata(params, "/", "Not Found");
}

export default function NotFoundPage() {
  return <NotFound />;
}
