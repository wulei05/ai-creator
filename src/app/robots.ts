import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_URL ?? 'https://ihuitoken.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/studio', '/chat'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
