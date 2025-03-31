import TopPage from "./clientPage.js";
import { MetadataProps } from "./metadata.js";

export default async function Page({ params }: MetadataProps) {
  return <TopPage locale={(await params).locale} />;
}
