import type { Metadata } from 'next'
import { LandingContent } from '@/components/marketing/LandingContent'

export const metadata: Metadata = {
  title: 'IHuiToken — AI图像、视频、对话创作平台',
  description: '一站式AI创作平台，支持Flux图像生成、Kling视频生成、多模型AI对话。立即注册获得100免费积分。',
  openGraph: {
    title: 'IHuiToken',
    description: '一站式AI创作平台',
    type: 'website',
  },
}

export default function LandingPage() {
  return <LandingContent />
}
