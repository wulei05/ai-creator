import type { MetadataRoute } from 'next';
import { ALL_MODEL_IDS } from '@/lib/model-info';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_URL ?? 'https://ihuitoken.com').replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,          lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/explore`,   lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/community`, lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/image`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/video`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/chat`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${base}/about`,     lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,   lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`,     lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const modelPages: MetadataRoute.Sitemap = ALL_MODEL_IDS.map((id) => ({
    url: `${base}/models/${id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...modelPages];
}
