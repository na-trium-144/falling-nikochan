import "@fontsource/merriweather/400.css";
import "@fontsource/kaisei-opti/japanese-400.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans-jp/japanese-400.css";
import "@/globals.css";
import type { Viewport } from "next";
import { themeColorDark, themeColorLight } from "@/metadata";

export const viewport: Viewport = {
  themeColor: [
    { color: themeColorLight },
    { media: "(prefers-color-scheme: dark)", color: themeColorDark },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
