import TopPage from "./clientPage.js";
import { SharePageModalProvider } from "./common/sharePageModal.jsx";
import { MetadataProps } from "./metadata.js";

export default async function Page({ params }: MetadataProps) {
  const locale = (await params).locale;
  return (
    <SharePageModalProvider locale={locale} from="top">
      <TopPage locale={locale} />
    </SharePageModalProvider>
  );
}
