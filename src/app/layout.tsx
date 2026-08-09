import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSiteBranding } from "@/lib/site-branding";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, faviconUrl } = await getSiteBranding();
  const base = (process.env.NEXT_PUBLIC_URL ?? 'https://ihuitoken.com').replace(/\/$/, '');
  const description = '用 AI 创作图片、视频、网页——汇集 Flux、Imagen、Kling、Sora 等顶级模型，一站式 AI 创作平台。';
  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    metadataBase: new URL(base),
    icons: faviconUrl !== "/favicon.ico" ? { icon: faviconUrl } : undefined,
    openGraph: {
      type: 'website',
      siteName,
      title: siteName,
      description,
      url: base,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
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
