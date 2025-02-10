import { IndexMain } from "./main/main.js";
import { MetadataProps } from "./metadata.js";

export default async function MainPage({ params }: MetadataProps) {
  return <IndexMain tab={undefined} locale={(await params).locale} />;
}
