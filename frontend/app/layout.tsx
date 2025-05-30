import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans-jp/japanese-400.css";
import "@/globals.css";
import { initViewport } from "@/metadata";

export const viewport = initViewport();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
