import GuidePage, {
  generateMetadata as generateMetadataFromIndex,
} from "./[index]/page.js";
import { MetadataProps } from "@/metadata.js";

export async function generateMetadata({ params }: MetadataProps) {
  return generateMetadataFromIndex({
    params: params.then((p) => ({ ...p, index: "1" })),
  });
}

export default async function Page({ params }: MetadataProps) {
  return GuidePage({
    params: params.then((p) => ({ ...p, index: "1" })),
  });
}
