import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource-variable/noto-sans";
import "@fontsource-variable/noto-sans-jp";
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
