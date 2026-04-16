'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Video, MessageSquare, Sparkles, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  {
    href: '/image',
    icon: ImageIcon,
    label: 'AI 图像',
    desc: '文字生成图像',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    examples: ['赛博朋克城市', '古风山水', '奇幻精灵'],
  },
  {
    href: '/video',
    icon: Video,
    label: 'AI 视频',
    desc: '文字生成视频',
    gradient: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    examples: ['电影级画质', '5s / 10s 时长', 'Kling V2'],
  },
  {
    href: '/chat',
    icon: MessageSquare,
    label: 'AI 对话',
    desc: '多模型智能助手',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    examples: ['GPT-4o', 'Claude Sonnet', 'DeepSeek'],
  },
];

const SHOWCASE = [
  { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=80', label: '赛博朋克', model: 'Flux Pro' },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80', label: '仙境山水', model: 'Gemini' },
  { url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80', label: '奇幻森林', model: 'Imagen 4' },
  { url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80', label: '星空宇宙', model: 'Flux Pro' },
  { url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80', label: '未来机器人', model: 'Flux Dev' },
  { url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400&q=80', label: '野生动物', model: 'Gemini' },
];

const HOT_PROMPTS = [
  'cyberpunk city at night, neon lights, 8k',
  '古风仙境，云雾缭绕，水墨风格',
  'ethereal elf queen in enchanted forest',
  'astronaut floating in deep space, nebula',
  'Japanese ramen, steaming broth, moody lighting',
  'hyper-realistic android face, sci-fi concept',
];

export default function DashboardHome() {
  const router = useRouter();
  const [promptIdx, setPromptIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i + 1) % HOT_PROMPTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-950 via-purple-950 to-slate-950 p-8 md:p-10">
        {/* glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cyan-600/15 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
            <Sparkles className="h-3 w-3" />
            AI Creator
          </div>
          <h1 className="mb-2 text-3xl font-black text-white md:text-4xl">
            从想象到现实
          </h1>
          <p className="mb-6 text-sm text-gray-400 md:text-base max-w-lg">
            选择一个 AI 工具开始创作，或者直接输入你的想法
          </p>

          {/* Animated prompt input */}
          <button
            onClick={() => router.push('/image')}
            className="group flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-violet-500/40 hover:bg-white/10"
          >
            <Zap className="h-4 w-4 shrink-0 text-violet-400" />
            <span className="flex-1 text-sm text-gray-400 truncate transition-all">
              {HOT_PROMPTS[promptIdx]}
            </span>
            <span className="shrink-0 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform group-hover:scale-105">
              生成图像 →
            </span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">快速开始</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, gradient, bg, border, examples }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                'group relative overflow-hidden rounded-xl border p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg',
                bg, border
              )}
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="mb-1 font-semibold">{label}</div>
              <div className="mb-3 text-xs text-muted-foreground">{desc}</div>
              <div className="flex flex-wrap gap-1">
                {examples.map(e => (
                  <span key={e} className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {e}
                  </span>
                ))}
              </div>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Community Showcase */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> 社区热门
          </h2>
          <button
            onClick={() => router.push('/community')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            查看更多 <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {SHOWCASE.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push('/community')}
              className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-border hover:ring-primary/40 transition-all hover:scale-[1.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.label}
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                <div className="text-[9px] text-white font-medium truncate">{item.label}</div>
                <div className="text-[8px] text-white/60">{item.model}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Studio CTA */}
      <button
        onClick={() => router.push('/studio')}
        className="group w-full rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center transition-all hover:border-primary/40 hover:bg-muted/50"
      >
        <div className="mb-2 text-2xl">🎨</div>
        <div className="font-semibold">进入创作室</div>
        <div className="mt-1 text-sm text-muted-foreground">管理你的创作项目，记录灵感</div>
        <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          开始 <ArrowRight className="h-3 w-3" />
        </div>
      </button>
    </div>
  );
}
