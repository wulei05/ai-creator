import type { Metadata } from 'next'
import { ImageIcon, VideoIcon, MessageSquareIcon, CheckIcon, ZapIcon, SparklesIcon } from 'lucide-react'
import { PACKAGES } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'AI Creator — AI图像、视频、对话创作平台',
  description: '一站式AI创作平台，支持Flux图像生成、Kling视频生成、多模型AI对话。立即注册获得100免费积分。',
  openGraph: {
    title: 'AI Creator',
    description: '一站式AI创作平台',
    type: 'website',
  },
}

const features = [
  {
    icon: ImageIcon,
    title: 'AI 图像生成',
    subtitle: 'Flux 1.1 Pro',
    description: '基于最先进的 Flux 1.1 Pro 模型，从文字描述生成高质量图像。支持多种风格和尺寸，每次生成仅需 10 积分。',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
  },
  {
    icon: VideoIcon,
    title: 'AI 视频生成',
    subtitle: 'Kling V2',
    description: '使用可灵 Kling V2 模型将文字转化为流畅视频。支持 5 秒和 10 秒视频，画面质量媲美专业制作。',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
  },
  {
    icon: MessageSquareIcon,
    title: 'AI 对话',
    subtitle: 'GPT-4o / Claude / DeepSeek',
    description: '接入 GPT-4o、Claude Sonnet 和 DeepSeek 等顶级大语言模型，满足各种对话、写作和分析需求。',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
]

const packageList = Object.entries(PACKAGES).map(([id, pkg]) => ({ id, ...pkg }))

export default function LandingPage() {
  return (
    <div className="bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <SparklesIcon className="h-4 w-4" />
            <span>注册即获 100 免费积分</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              一站式 AI 创作
            </span>
            <br />
            <span className="text-white">平台</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            集成顶级 AI 模型，支持图像生成、视频创作和智能对话。
            无需专业技能，让 AI 释放你的创作潜力。
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/register"
              className="flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
            >
              <ZapIcon className="h-4 w-4" />
              开始创作
            </a>
            <a
              href="#features"
              className="flex h-12 items-center rounded-full border border-white/20 px-8 text-base font-medium text-gray-300 transition-all hover:border-white/40 hover:text-white"
            >
              查看演示
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-20 grid grid-cols-3 gap-8 border-t border-white/10 pt-12 text-center max-w-2xl">
          <div>
            <div className="text-3xl font-bold text-white">3+</div>
            <div className="mt-1 text-sm text-gray-400">AI 模型</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">100</div>
            <div className="mt-1 text-sm text-gray-400">免费积分</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">3 合 1</div>
            <div className="mt-1 text-sm text-gray-400">创作工具</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">强大的 AI 创作工具</h2>
            <p className="mx-auto max-w-xl text-gray-400">
              三大核心功能，满足你的一切创作需求
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`rounded-2xl border ${feature.borderColor} ${feature.bgColor} p-6 transition-all hover:scale-[1.02]`}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                    {feature.subtitle}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">简单透明的定价</h2>
            <p className="mx-auto max-w-xl text-gray-400">
              按需购买积分，无月费，无订阅，用多少买多少
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packageList.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  pkg.popular
                    ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/50'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-1 text-xs font-semibold text-white">
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      ¥{(pkg.price_fen / 100).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="mb-6 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
                    <span>{pkg.credits} 积分</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                    <CheckIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
                    <span>可生成约 {Math.floor(pkg.credits / 10)} 张图像</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                    <CheckIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
                    <span>或 {Math.floor(pkg.credits / 50)} 段视频</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                    <CheckIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
                    <span>永久有效</span>
                  </div>
                </div>

                <a
                  href="/register"
                  className={`block w-full rounded-full py-2.5 text-center text-sm font-medium transition-all ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90'
                      : 'border border-white/20 text-gray-300 hover:border-white/40 hover:text-white'
                  }`}
                >
                  立即购买
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            注册即获得 100 免费积分，无需信用卡
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/40 to-cyan-900/20 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            立即开始你的 AI 创作之旅
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-gray-400">
            立即注册，获得 100 免费积分。无需信用卡，无需订阅，马上体验 AI 创作的魔力。
          </p>
          <a
            href="/register"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-10 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105"
          >
            <ZapIcon className="h-4 w-4" />
            立即注册，获得100免费积分
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            AI Creator
          </a>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AI Creator. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="/login" className="hover:text-gray-300 transition-colors">登录</a>
            <a href="/register" className="hover:text-gray-300 transition-colors">注册</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
