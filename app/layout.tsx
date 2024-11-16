import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const description =
  "Simple and cute rhythm game, where anyone can create and share charts.";

export const metadata: Metadata = {
  metadataBase: new URL("https://nikochan.natrium144.org"),
  title: {
    template: "%s | Falling Nikochan",
    default: "Falling Nikochan",
  },
  description,
  generator: "Next.js",
  applicationName: "Falling Nikochan",
  referrer: "origin-when-cross-origin",
  icons: {
    // これを1つでも書くと /app にファイルを置く metadata API が無効になるっぽい?
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: {
      template: "%s",
      default: "Falling Nikochan",
    },
    description,
    // todo: images
    type: "website",
    locale: "ja_JP",
    siteName: "Falling Nikochan",
  },
  twitter: {
    card: "summary",
    title: {
      template: "%s | Falling Nikochan",
      default: "Falling Nikochan",
    },
    description,
    // images
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-w-screen min-h-screen overflow-auto ">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
