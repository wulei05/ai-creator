import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSiteBranding } from "@/lib/site-branding";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, faviconUrl } = await getSiteBranding();
  return {
    title: siteName,
    description: "AI 创作平台",
    icons: faviconUrl !== "/favicon.ico" ? { icon: faviconUrl } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
