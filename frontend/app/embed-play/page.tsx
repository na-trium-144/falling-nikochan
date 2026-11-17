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
  return <EmbeddedPlay />;
}
