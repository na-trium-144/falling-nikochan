import { initMetadata } from "@/metadata.js";
import EmbeddedPlay from "./clientPage.js";

export async function generateMetadata() {
  return initMetadata(
    null,
    null,
    "Embedded Play",
    "Headless game engine to be used inside webview / iframe"
  );
}

export default function EmbeddedPlayPage() {
  return (
    <html>
      <body className="fn-body relative touch-none select-none">
        <EmbeddedPlay />
      </body>
    </html>
  );
}
