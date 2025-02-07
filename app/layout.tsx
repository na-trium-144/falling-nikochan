import * as localeRoute from "@/layout.js";

export const metadata = localeRoute.metadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <localeRoute.default params={{ locale: "en" }}>
      {children}
    </localeRoute.default>
  );
}
