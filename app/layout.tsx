import type { Metadata } from "next";
import "./globals.css";

const description = "Simple and cute rhythm game, where anyone can create and share charts.";

export const metadata: Metadata = {
  metadataBase: new URL('https://nikochan.natrium144.org'),
  title: {
    template: "%s | Falling Nikochan",
    default: "Falling Nikochan",
  },
  description,
  generator: 'Next.js',
  applicationName: 'Falling Nikochan',
  referrer: 'origin-when-cross-origin',
  openGraph: {
    title: {
      template: "%s",
      default: "Falling Nikochan",
    },
    description,
    // todo: images
    type: 'website',
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
      <body className="bg-gradient-to-t from-sky-50 to-sky-200 min-w-screen min-h-screen overflow-auto ">
        {children}
      </body>
    </html>
  );
}
