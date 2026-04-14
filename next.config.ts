import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'fal.media' },
      { hostname: '*.supabase.co' },
      { hostname: 'cdn.klingai.com' },
    ],
  },
}

export default nextConfig
