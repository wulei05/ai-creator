import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckIcon, ZapIcon, SparklesIcon, ArrowRightIcon } from 'lucide-react'
import { PACKAGES } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'AI Creator — AI图像、视频、对话创作平台',
  description: '一站式AI创作平台，支持Flux图像生成、Kling视频生成、多模型AI对话。立即注册获得100免费积分。',
  openGraph: {
    title: 'AI Creator',
    description: '一站式AI创作平台',
    type: 'website',
  },
}

const packageList = Object.entries(PACKAGES).map(([id, pkg]) => ({ id, ...pkg }))

// Showcase images from Unsplash
const SHOWCASE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80', label: '赛博朋克城市' },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', label: '仙境山水' },
  { url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80', label: '奇幻森林' },
  { url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80', label: '星空宇宙' },
  { url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80', label: '未来机器人' },
  { url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&q=80', label: '野生动物' },
  { url: 'https://images.unsplash.com/photo-1522383225753-aa6857c2b0e7?w=400&q=80', label: '动漫风格' },
  { url: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80', label: '美食摄影' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', label: '梦幻雪山' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80', label: '海浪冲击' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', label: '人物肖像' },
  { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80', label: '咖啡时光' },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')
  return (
    <div className="bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 py-2.5 text-center text-sm font-medium">
        <span>🎉 注册即送 100 免费积分，立即体验 AI 创作魔力</span>
        <a href="/register" className="ml-3 inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-80">
          立即领取 <ArrowRightIcon className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/20 blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-cyan-700/15 blur-[100px]" />
          <div className="absolute left-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-pink-700/10 blur-[80px]" />
        </div>

        {/* Grid texture */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-5xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-5 py-2 text-sm text-violet-300 backdrop-blur">
            <SparklesIcon className="h-4 w-4" />
            <span>新一代 AI 创作平台 · 多模型支持</span>
          </div>

          {/* Main headline */}
          <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-8xl">
            <span className="block text-white">从平凡到非凡</span>
            <span className="block bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mt-2">
              一站式超级 AI 创作
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl">
            集成 Flux、Imagen、Gemini、Kling 等顶级 AI 模型<br className="hidden sm:block" />
            图像生成 · 视频创作 · 智能对话，无需专业技能
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/register"
              className="group flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-10 text-base font-bold text-white shadow-2xl shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-105"
            >
              <ZapIcon className="h-5 w-5" />
              开始创作
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#showcase"
              className="flex h-14 items-center rounded-full border border-white/15 bg-white/5 px-10 text-base font-medium text-gray-300 backdrop-blur transition-all hover:border-white/30 hover:text-white hover:bg-white/10"
            >
              查看作品
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex items-center justify-center gap-8 sm:gap-16 text-center">
            {[
              { value: '10+', label: 'AI 模型' },
              { value: '100', label: '免费积分' },
              { value: '∞', label: '创意可能' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-black text-white sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Showcase — infinite scroll */}
      <section id="showcase" className="py-16 overflow-hidden">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">AI 创作作品展示</h2>
          <p className="mt-2 text-sm text-gray-500">由 AI Creator 用户生成的真实作品</p>
        </div>

        {/* Row 1 — scroll left */}
        <div className="relative flex gap-4 overflow-hidden mb-4">
          <div className="flex gap-4 animate-[scroll-left_40s_linear_infinite]">
            {[...SHOWCASE_IMAGES, ...SHOWCASE_IMAGES].map((img, i) => (
              <div key={i} className="relative h-52 w-52 shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs text-white/80 font-medium">{img.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — scroll right */}
        <div className="relative flex gap-4 overflow-hidden">
          <div className="flex gap-4 animate-[scroll-right_50s_linear_infinite]">
            {[...SHOWCASE_IMAGES.slice(4), ...SHOWCASE_IMAGES, ...SHOWCASE_IMAGES.slice(0, 4)].map((img, i) => (
              <div key={i} className="relative h-52 w-52 shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs text-white/80 font-medium">{img.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">强大的 AI 创作能力</h2>
            <p className="mx-auto max-w-xl text-gray-400">多维度创作工具，满足你的一切灵感</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                emoji: '🖼️',
                title: 'AI 图像生成',
                desc: '支持 Flux Pro/Dev/Schnell、Imagen 4 Ultra、Gemini 等 10+ 顶级图像模型，从文字一键生成高质量图像。',
                gradient: 'from-violet-500/20 to-purple-600/10',
                border: 'border-violet-500/20',
              },
              {
                emoji: '🎬',
                title: 'AI 视频创作',
                desc: '接入可灵 Kling V2 模型，文字转视频，支持 5s/10s 高清视频生成，画质媲美专业制作。',
                gradient: 'from-cyan-500/20 to-blue-600/10',
                border: 'border-cyan-500/20',
              },
              {
                emoji: '💬',
                title: 'AI 智能对话',
                desc: '集成 GPT-4o、Claude Sonnet、DeepSeek、Gemini 等顶级大语言模型，写作、分析、问答一站搞定。',
                gradient: 'from-emerald-500/20 to-teal-600/10',
                border: 'border-emerald-500/20',
              },
              {
                emoji: '🎨',
                title: 'AI 图像工具',
                desc: '智能扩图、物体移除、背景抠图、高清放大，专业修图工具触手可及。',
                gradient: 'from-orange-500/20 to-rose-600/10',
                border: 'border-orange-500/20',
              },
              {
                emoji: '🏛️',
                title: '创作室',
                desc: '个人创作空间，管理你的 AI 创作项目，一键从灵感到成品。',
                gradient: 'from-amber-500/20 to-yellow-600/10',
                border: 'border-amber-500/20',
              },
              {
                emoji: '🌐',
                title: '创作社区',
                desc: '发现全球创作者的 AI 艺术作品，分享灵感、互动交流、获取创作灵感。',
                gradient: 'from-pink-500/20 to-fuchsia-600/10',
                border: 'border-pink-500/20',
              },
            ].map(f => (
              <div key={f.title} className={`rounded-2xl border ${f.border} bg-gradient-to-br ${f.gradient} p-6 backdrop-blur transition-all hover:scale-[1.02] hover:brightness-110`}>
                <div className="mb-3 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
              </div>
            ))}
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

                <div className="mb-6 border-t border-white/10 pt-4 space-y-2">
                  {[
                    `${pkg.credits} 积分`,
                    `可生成约 ${Math.floor(pkg.credits / 10)} 张图像`,
                    `或 ${Math.floor(pkg.credits / 50)} 段视频`,
                    '永久有效',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckIcon className="h-4 w-4 text-violet-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
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
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/40 via-purple-900/20 to-cyan-900/20 p-12 text-center ring-1 ring-white/5">
          <div className="mb-4 text-4xl">✨</div>
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            立即开始你的 AI 创作之旅
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-gray-400">
            无需信用卡，无需订阅，注册即送 100 积分，马上体验 AI 创作的魔力。
          </p>
          <a
            href="/register"
            className="inline-flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-12 text-base font-bold text-white shadow-2xl shadow-violet-500/30 transition-all hover:shadow-violet-500/50 hover:scale-105"
          >
            <ZapIcon className="h-5 w-5" />
            免费开始创作
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
