import { getConfig } from '@/lib/config';

export type SiteBranding = {
  logoUrl: string;
  siteName: string;
  faviconUrl: string;
};

const DEFAULTS = {
  logoUrl: '/logo.webp',
  siteName: 'IHuiToken',
  faviconUrl: '/favicon.ico',
} as const;

export async function getSiteBranding(): Promise<SiteBranding> {
  const [logoUrl, siteName, faviconUrl] = await Promise.all([
    getConfig('SITE_LOGO_URL'),
    getConfig('SITE_NAME'),
    getConfig('SITE_FAVICON_URL'),
  ]);
  return {
    logoUrl: logoUrl || DEFAULTS.logoUrl,
    siteName: siteName || DEFAULTS.siteName,
    faviconUrl: faviconUrl || DEFAULTS.faviconUrl,
  };
}
