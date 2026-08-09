'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Video, MessageSquare } from 'lucide-react';
import { PACKAGES } from '@/lib/pricing';

/* ─── Data ─── */
const ROW1_MODELS = [
  { name: 'GPT-4o',          cat: 'dialog',    label: '对话', provider: 'OpenAI' },
  { name: 'Claude Sonnet 4', cat: 'dialog',    label: '对话', provider: 'Anthropic' },
  { name: 'DeepSeek R1',     cat: 'dialog',    label: '对话', provider: 'DeepSeek' },
  { name: 'Gemini 2.5 Pro',  cat: 'multimodal',label: '多模态', provider: 'Google' },
  { name: 'GLM-4-Plus',      cat: 'dialog',    label: '对话', provider: '智谱AI' },
  { name: 'Kimi 128K',       cat: 'dialog',    label: '对话', provider: '月之暗面' },
  { name: 'Qwen Max',        cat: 'dialog',    label: '对话', provider: '阿里云' },
  { name: 'Grok 4',          cat: 'dialog',    label: '对话', provider: 'xAI' },
];
const ROW2_MODELS = [
  { name: 'Flux Pro',        cat: 'image', label: '图像', provider: 'Black Forest' },
  { name: 'GPT Image 2',     cat: 'image', label: '图像', provider: 'OpenAI' },
  { name: 'Imagen 4 Ultra',  cat: 'image', label: '图像', provider: 'Google' },
  { name: 'Nano Banana',     cat: 'image', label: '图像', provider: 'fal.ai' },
  { name: 'Grok Image',      cat: 'image', label: '图像', provider: 'xAI' },
  { name: 'Gemini Flash Img',cat: 'image', label: '图像', provider: 'Google' },
  { name: 'Flux Schnell',    cat: 'image', label: '图像', provider: 'Black Forest' },
  { name: 'Imagen 4',        cat: 'image', label: '图像', provider: 'Google' },
];
const ROW3_MODELS = [
  { name: 'Kling v2.6',      cat: 'video', label: '视频', provider: '快手' },
  { name: 'Seedance 2',      cat: 'video', label: '视频', provider: '字节跳动' },
  { name: 'Veo 3.1',         cat: 'video', label: '视频', provider: 'Google' },
  { name: 'Grok Video',      cat: 'video', label: '视频', provider: 'xAI' },
  { name: 'Wan 2.2',         cat: 'video', label: '视频', provider: '阿里巴巴' },
  { name: 'Kling v2',        cat: 'video', label: '视频', provider: '快手' },
  { name: 'Veo 2',           cat: 'video', label: '视频', provider: 'Google' },
  { name: 'Kling v1.6',      cat: 'video', label: '视频', provider: '快手' },
];

const CAT_COLOR: Record<string, { dot: string; tag: string; bg: string }> = {
  dialog:     { dot: '#67e8f9', tag: 'rgba(103,232,249,.08)',  bg: 'rgba(103,232,249,.25)' },
  image:      { dot: '#f59e0b', tag: 'rgba(245,158,11,.08)',   bg: 'rgba(245,158,11,.25)'  },
  video:      { dot: '#fb7185', tag: 'rgba(251,113,133,.08)',  bg: 'rgba(251,113,133,.25)' },
  multimodal: { dot: '#a78bfa', tag: 'rgba(167,139,250,.08)',  bg: 'rgba(167,139,250,.25)' },
};
const CAT_CARD_BG: Record<string, string> = {
  dialog:     'linear-gradient(160deg,#0a1628,#142446)',
  image:      'linear-gradient(160deg,#1a1008,#2a1a10)',
  video:      'linear-gradient(160deg,#180a16,#2c1230)',
  multimodal: 'linear-gradient(160deg,#0a1618,#0f2830)',
};

const GALLERY_ITEMS = [
  { h: 1.4, label: '赛博朋克猫咪，东京街头，霓虹雨',    model: 'Flux Pro',         img: 'https://picsum.photos/seed/neon-alley/400/560' },
  { h: 1.0, label: '极简北欧风格室内，白色原木',          model: 'GPT Image 2',      img: 'https://picsum.photos/seed/nordic-room/400/400' },
  { h: 1.7, label: '水墨山水，现代诗意，留白',            model: 'Nano Banana',      img: 'https://picsum.photos/seed/misty-mountain/400/680' },
  { h: 1.1, label: '机甲少女，樱花飞舞，动漫风格',        model: 'Imagen 4 Ultra',   img: 'https://picsum.photos/seed/cherry-blossom/400/440' },
  { h: 1.3, label: '空旷星球地表，科幻冒险场景',          model: 'Flux Schnell',     img: 'https://picsum.photos/seed/red-desert/400/520' },
  { h: 1.0, label: '精品咖啡馆，暖光，胶片质感',          model: 'Grok Image',       img: 'https://picsum.photos/seed/warm-cafe/400/400' },
  { h: 1.5, label: '古典油画风，欧洲森林女神',            model: 'Flux Pro',         img: 'https://picsum.photos/seed/deep-forest/400/600' },
  { h: 1.2, label: '未来城市俯瞰，霓虹灯矩阵',            model: 'Imagen 4',         img: 'https://picsum.photos/seed/city-lights/400/480' },
  { h: 1.0, label: '品牌产品图，极简白底，高光反射',      model: 'Nano Banana',      img: 'https://picsum.photos/seed/minimal-object/400/400' },
  { h: 1.6, label: '手绘水彩插画，儿童故事书风格',        model: 'Gemini Flash Img', img: 'https://picsum.photos/seed/pastel-colors/400/640' },
  { h: 1.1, label: '暗黑学院风，玫瑰与蜡烛',              model: 'Flux Pro',         img: 'https://picsum.photos/seed/dark-roses/400/440' },
  { h: 1.3, label: '浮世绘风，现代城市人物速写',          model: 'GPT Image 2',      img: 'https://picsum.photos/seed/urban-street/400/520' },
];

const FEATURES = [
  { emoji: '💬', name: 'AI 对话', badge: 'NEW', desc: '接入 GPT-4o、Claude Sonnet、DeepSeek R1 等顶级对话模型，多轮对话无缝切换，支持视觉输入。', href: '/chat' },
  { emoji: '🎨', name: '图像生成', badge: '', desc: 'Flux Pro、Imagen 4 Ultra、Nano Banana 等 20+ 图像模型，高精度输出商业级作品，支持参考图。', href: '/image' },
  { emoji: '🎬', name: '视频生成', badge: 'HOT', badgeStyle: { background: 'rgba(103,232,249,.12)', color: '#67e8f9', border: '1px solid rgba(103,232,249,.3)' }, desc: 'Kling v2.6、Seedance 2、Veo 3.1 领衔，文生视频与图生视频无缝衔接，最长 10 秒。', href: '/video' },
  { emoji: '🖼️', name: '创作室', badge: 'BETA', desc: '统一管理你的全部作品，扩图、抠图、移除物体，拖拽式创作工作流，一站搞定。', href: '/studio' },
];

const MODEL_SHOWCASE = [
  { name: 'GPT Image 2',    type: 'image',  desc: 'OpenAI 最强图像模型，精确文字渲染，照片级写实输出',    tag: 'NEW', tagStyle: { color: '#f59e0b', borderColor: 'rgba(245,158,11,.4)', background: 'rgba(245,158,11,.08)' }, thumb: 'linear-gradient(135deg,#0f172a,#1e3a5f)', href: '/image', dot: '#67e8f9', img: 'https://picsum.photos/seed/gpt-image/800/450' },
  { name: 'Kling v2.6 Omni',type: 'video',  desc: '可灵旗舰视频模型，物理真实感与镜头运动行业领先',    tag: 'HOT', tagStyle: { color: '#fb7185', borderColor: 'rgba(251,113,133,.4)', background: 'rgba(251,113,133,.08)' }, thumb: 'linear-gradient(135deg,#150a1f,#3b0764)', href: '/video', dot: '#fb7185', img: 'https://picsum.photos/seed/kling-video/800/450' },
  { name: 'Claude Sonnet 4', type: 'dialog', desc: 'Anthropic 旗舰推理模型，超长上下文，复杂任务首选',   tag: 'PRO', tagStyle: { color: '#67e8f9', borderColor: 'rgba(103,232,249,.4)', background: 'rgba(103,232,249,.08)' }, thumb: 'linear-gradient(135deg,#0f1a10,#14532d)', href: '/chat', dot: '#a78bfa', img: 'https://picsum.photos/seed/claude-chat/800/450' },
  { name: 'Seedance 2',      type: 'video',  desc: '字节跳动视听同步旗舰，运镜流畅，画质电影级',        tag: 'NEW', tagStyle: { color: '#f59e0b', borderColor: 'rgba(245,158,11,.4)', background: 'rgba(245,158,11,.08)' }, thumb: 'linear-gradient(135deg,#1a1000,#451a03)', href: '/video', dot: '#f59e0b', img: 'https://picsum.photos/seed/seedance-video/800/450' },
  { name: 'DeepSeek R1',     type: 'dialog', desc: '开源最强推理模型，数学、代码与科学任务能力出众',    tag: 'HOT', tagStyle: { color: '#fb7185', borderColor: 'rgba(251,113,133,.4)', background: 'rgba(251,113,133,.08)' }, thumb: 'linear-gradient(135deg,#0a0e1a,#162032)', href: '/chat', dot: '#67e8f9', img: 'https://picsum.photos/seed/deepseek-ai/800/450' },
  { name: 'Flux Pro',        type: 'image',  desc: 'Black Forest Labs 旗舰图像模型，商业级输出无水印',  tag: 'PRO', tagStyle: { color: '#67e8f9', borderColor: 'rgba(103,232,249,.4)', background: 'rgba(103,232,249,.08)' }, thumb: 'linear-gradient(135deg,#1a0a0e,#450a1a)', href: '/image', dot: '#f59e0b', img: 'https://picsum.photos/seed/flux-image/800/450' },
];

const TESTIMONIALS = [
  { name: '张涛', role: '资深 UI 设计师', avatar: '张', quote: '甲方天天改需求，现在 1 分钟出 10 版方案，过稿率高了 3 倍。iHuiToken 已经成为我工作室的标配工具。', avatarBg: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { name: '林书涵', role: '百万粉自媒体博主', avatar: '林', quote: '靠 iHuiToken 做封面图，涨粉速度比之前快了 5 倍，关键是真的不用学 PS，直接出商业级效果。', avatarBg: 'linear-gradient(135deg,#67e8f9,#0891b2)' },
  { name: '阿俊', role: '跨境电商卖家', avatar: '阿', quote: 'Flux Pro 出的产品图直接上 Shopify，转化率比原来的摄影图高了 28%，没想到 AI 能这么实用。', avatarBg: 'linear-gradient(135deg,#fb7185,#be123c)' },
  { name: '陈志强', role: '全栈工程师', avatar: '陈', quote: '用 DeepSeek R1 处理代码 Review，效率提升至少 4 倍。积分制对我这种用量不固定的开发者太友好了。', avatarBg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  { name: '王芳', role: '在线教育创作者', avatar: '王', quote: '教学视频用 Kling 一键生成，质感完全不像 AI，学生以为我请了专业摄影团队。', avatarBg: 'linear-gradient(135deg,#10b981,#065f46)' },
  { name: '苏苏', role: '独立游戏开发', avatar: '苏', quote: '美术外包的钱省了，DeepSeek 写代码，一个人撑起整个项目。IHuiToken 是我最划算的投资。', avatarBg: 'linear-gradient(135deg,#a78bfa,#6d28d9)' },
];

const packageList = Object.entries(PACKAGES).map(([id, pkg]) => ({ id, ...pkg })).filter(p => p.id !== 'starter');

const FAQS = [
  { q: '注册后可以免费使用吗？', a: '可以。注册即送 100 积分，足够生成约 10 张图像或体验多个对话，足够你感受全部功能。' },
  { q: '积分会过期吗？', a: '不会。积分永久有效，随时使用，无任何时效限制。' },
  { q: '生成失败会扣积分吗？', a: '不会。失败任务自动原路退还全部积分，完全无损。' },
  { q: '与直接购买各家 API 有何区别？', a: '免去多平台注册和充值；统一额度池；模型随时切换；价格通常低于官方单独购买。' },
];

/* ─── Sub-components ─── */

function MarqueeRow({ models, dir }: { models: typeof ROW1_MODELS; dir: 'left' | 'left-slow' | 'right' | 'right-slow' }) {
  const doubled = [...models, ...models];
  const cls = `marquee-track-${dir}`;
  return (
    <div
      className="marquee-wrap overflow-hidden py-2"
      style={{ mask: 'linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)', WebkitMask: 'linear-gradient(90deg,transparent 0%,black 8%,black 92%,transparent 100%)' }}
    >
      <div className={`flex gap-4 w-max ${cls}`}>
        {doubled.map((m, i) => {
          const c = CAT_COLOR[m.cat];
          return (
            <div
              key={i}
              className="flex-shrink-0 w-[240px] h-[88px] rounded-[20px] p-4 flex flex-col justify-between relative overflow-hidden cursor-pointer transition-opacity duration-200 hover:opacity-90"
              style={{ background: CAT_CARD_BG[m.cat], border: '1px solid rgba(255,255,255,.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.dot, boxShadow: `0 0 10px ${c.dot}` }} />
                <span className="text-[1.0625rem] font-bold text-white tracking-[-0.02em] leading-none truncate">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-[0.06em]" style={{ background: c.tag, border: `1px solid ${c.bg}`, color: c.dot }}>{m.label}</span>
                <span className="text-[0.6875rem] text-[#4b5368]">{m.provider}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingContent() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image' | 'video' | 'dialog'>('image');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const paths = { image: '/image', video: '/video', dialog: '/chat' } as const;
    router.push(`${paths[mode]}?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="overflow-x-hidden">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden" style={{ paddingTop: 80, paddingBottom: 60, textAlign: 'center' }}>
        {/* Pulse rings */}
        <div className="pointer-events-none absolute" style={{ left: '50%', top: '45%', zIndex: -1 }}>
          {[300, 500, 700, 900].map((size, i) => (
            <div key={size} className="pulse-ring" style={{ width: size, height: size, animationDelay: `${i * 0.8}s` }} />
          ))}
        </div>

        <div className="mx-auto max-w-[900px] px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] mb-7"
            style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', color: '#fbbf24' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b', animation: 'badge-blink 2s ease-in-out infinite' }} />
            100+ 顶级 AI 模型 · 实时更新
          </div>

          {/* Title */}
          <h1 className="mb-5 font-bold leading-[1.05] tracking-[-0.04em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(2.6rem,6.5vw,5rem)', color: '#f0f4ff' }}>
            从平凡到<span style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#fbbf24 40%,#67e8f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>非凡</span><br />
            超级 AI 创作平台
          </h1>

          {/* Sub */}
          <p className="mx-auto mb-9 max-w-[560px] leading-[1.65]" style={{ fontSize: '1.0625rem', color: '#8b92a8' }}>
            集 GPT、Claude、DeepSeek、Flux、Kling 于一体<br />
            图像 · 视频 · 对话，一个平台全搞定
          </p>

          {/* Prompt box */}
          <div
            className="mx-auto mb-12 flex items-end gap-3 rounded-[28px] px-5 py-1.5 transition-all duration-200"
            style={{ maxWidth: 680, background: '#12161f', border: '1px solid rgba(255,255,255,.18)' }}
            onFocus={(e) => (e.currentTarget.style.cssText += ';border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.12),0 0 40px rgba(245,158,11,.15)')}
            onBlur={(e) => (e.currentTarget.style.cssText = `max-width:680px;background:#12161f;border:1px solid rgba(255,255,255,.18)`)}
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
              placeholder="描述你想创作的内容，比如：一只赛博朋克风格的猫在东京街头…"
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent py-3 text-[0.9375rem] leading-[1.5] outline-none"
              style={{ color: '#f0f4ff', minHeight: 52, maxHeight: 160 }}
            />
            <div className="flex flex-col gap-1.5 items-end pb-1.5">
              <div className="flex gap-1">
                {(['image', 'video', 'dialog'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className="rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold transition-all border"
                    style={mode === m
                      ? { background: 'rgba(245,158,11,.12)', borderColor: 'rgba(245,158,11,.4)', color: '#fbbf24' }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,.08)', color: '#4b5368' }
                    }
                  >
                    {m === 'image' ? '图像' : m === 'video' ? '视频' : '对话'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 rounded-[14px] px-5 py-2.5 text-[0.875rem] font-bold transition-all hover:scale-[1.04]"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.boxShadow = '0 0 24px rgba(245,158,11,.4)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.boxShadow = 'none')}
              >
                <span>✦</span> 立即生成
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto flex justify-center" style={{ maxWidth: 640 }}>
            {[
              { n: '100', hi: true, suffix: '+', label: 'AI 模型' },
              { n: '5',   hi: true, suffix: '万+', label: '月活创作者' },
              { n: '200', hi: true, suffix: '万+', label: '累计作品' },
              { n: '4.', hi: false, suffix: '', label: '满意度', special: '9' },
            ].map((s, i) => (
              <div key={i} className="flex-1 text-center px-4" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                <span className="block font-bold" style={{ fontFamily: 'var(--font-sans)', fontSize: '1.875rem', color: '#f0f4ff' }}>
                  {s.hi ? <span style={{ color: '#f59e0b' }}>{s.n}</span> : s.n}
                  {s.special && <span style={{ color: '#f59e0b' }}>{s.special}</span>}
                  {s.suffix}
                </span>
                <div className="mt-0.5 text-xs" style={{ color: '#4b5368' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MODEL MARQUEE ══ */}
      <section className="relative py-24 overflow-hidden reveal-section">
        <div
          className="absolute pointer-events-none"
          style={{ left: '50%', top: 0, transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(ellipse at center,rgba(245,158,11,.06) 0%,transparent 70%)' }}
        />
        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: '#f59e0b' }}>
            <span className="w-6 h-px" style={{ background: 'rgba(245,158,11,.4)' }} />
            Integrated Models
            <span className="w-6 h-px" style={{ background: 'rgba(245,158,11,.4)' }} />
          </div>
          <h2 className="font-bold tracking-[-0.03em] mb-3" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', color: '#f0f4ff' }}>
            全栈 AI · <span style={{ color: '#f59e0b' }}>接入全球顶级模型</span>
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#4b5368', maxWidth: 480, margin: '0 auto' }}>
            从对话到视觉，从视频到多模态，一个平台调用所有前沿模型
          </p>
        </div>
        <div className="space-y-2">
          <MarqueeRow models={ROW1_MODELS} dir="left-slow" />
          <MarqueeRow models={ROW2_MODELS} dir="right" />
          <MarqueeRow models={ROW3_MODELS} dir="right-slow" />
        </div>
      </section>

      {/* ══ GALLERY ══ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 reveal-section">
        <div className="flex items-end justify-between mb-9">
          <div>
            <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>社区作品</div>
            <h2 className="font-bold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>全球创作者的精彩瞬间</h2>
          </div>
          <a href="/community" className="text-[0.8125rem] pb-0.5 transition-colors" style={{ color: '#8b92a8', borderBottom: '1px solid rgba(255,255,255,.08)' }}>查看全部 →</a>
        </div>
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {GALLERY_ITEMS.map((it, i) => (
            <a key={i} href="/image" className="group block break-inside-avoid mb-3 rounded-[14px] overflow-hidden relative cursor-pointer border transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,.6)]" style={{ border: '1px solid rgba(255,255,255,.08)', background: '#12161f' }}>
              <div style={{ width: '100%', paddingBottom: `${it.h * 100}%`, position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.img}
                  alt={it.label}
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  className="group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4" style={{ background: 'linear-gradient(to top,rgba(8,10,15,.95) 0%,transparent 60%)' }}>
                  <p className="text-xs leading-[1.4] mb-2 line-clamp-2" style={{ color: '#8b92a8' }}>{it.label}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold w-fit" style={{ background: 'rgba(245,158,11,.2)', border: '1px solid rgba(245,158,11,.35)', color: '#fbbf24' }}>✦ {it.model}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 reveal-section">
        <div className="mb-9">
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>核心能力</div>
          <h2 className="font-bold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>一站式超级 AI 工作台</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FEATURES.map((f) => (
            <a key={f.name} href={f.href} className="group block rounded-[20px] p-7 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 no-underline" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }}
              onMouseEnter={(e) => { (e.currentTarget.style.borderColor = 'rgba(245,158,11,.4)'); (e.currentTarget.querySelector('.feat-glow') as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'); (e.currentTarget.querySelector('.feat-glow') as HTMLElement).style.opacity = '0'; }}
            >
              <div className="feat-glow absolute inset-0 transition-opacity duration-300 pointer-events-none" style={{ opacity: 0, background: 'radial-gradient(ellipse at top left,rgba(245,158,11,.08) 0%,transparent 60%)' }} />
              <div className="relative">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center text-[1.375rem] mb-4" style={{ background: '#181d28', border: '1px solid rgba(255,255,255,.08)' }}>{f.emoji}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[1.0625rem] font-semibold" style={{ fontFamily: 'var(--font-sans)', color: '#f0f4ff' }}>{f.name}</span>
                  {f.badge && (
                    <span className="inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em]"
                      style={f.badgeStyle ?? { background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)' }}>
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-[0.8125rem] leading-[1.6]" style={{ color: '#8b92a8' }}>{f.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ MODEL SHOWCASE ══ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 reveal-section">
        <div className="flex items-end justify-between mb-9">
          <div>
            <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>精选模型</div>
            <h2 className="font-bold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>顶级 AI 模型，一键直达</h2>
          </div>
          <a href="/explore" className="text-[0.8125rem] pb-0.5 transition-colors" style={{ color: '#8b92a8', borderBottom: '1px solid rgba(255,255,255,.08)' }}>全部模型 →</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODEL_SHOWCASE.map((m) => (
            <a key={m.name} href={m.href} className="group block rounded-[20px] overflow-hidden no-underline transition-all duration-200 hover:-translate-y-1.5" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)')}
            >
              <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.img}
                  alt={m.name}
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  className="group-hover:scale-[1.06]"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(8,10,15,.7) 0%,rgba(8,10,15,.3) 100%)' }} />
                {/* Category icon */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: m.dot, opacity: 0.8 }}>
                  {m.type === 'image' ? <Camera size={40} strokeWidth={1.5} /> : m.type === 'video' ? <Video size={40} strokeWidth={1.5} /> : <MessageSquare size={40} strokeWidth={1.5} />}
                </div>
                {/* Glow dot */}
                <span className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full" style={{ background: m.dot, boxShadow: `0 0 16px ${m.dot}` }} />
              </div>
              <div className="p-4">
                <div className="text-[0.9375rem] font-semibold mb-1" style={{ fontFamily: 'var(--font-sans)', color: '#f0f4ff' }}>{m.name}</div>
                <div className="text-xs leading-[1.5] mb-3" style={{ color: '#8b92a8' }}>{m.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold border" style={m.tagStyle}>{m.tag}</span>
                  <span className="flex items-center gap-1 text-xs transition-colors" style={{ color: '#4b5368' }}>
                    立即体验 →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 reveal-section">
        <div className="text-center mb-12">
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>透明定价</div>
          <h2 className="font-bold tracking-[-0.03em] mb-2" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>按需购买，无月费无订阅</h2>
          <p style={{ color: '#8b92a8', fontSize: '0.875rem' }}>积分永久有效 · 全模型通用 · 随时充值</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {packageList.map((pkg) => (
            <div key={pkg.id} className="relative rounded-[28px] p-8 transition-all duration-200 hover:-translate-y-1.5"
              style={pkg.popular
                ? { background: 'linear-gradient(160deg,rgba(245,158,11,.07) 0%,#0d1017 100%)', border: '1px solid #f59e0b', boxShadow: '0 0 0 1px rgba(245,158,11,.2),0 0 60px rgba(245,158,11,.08)' }
                : { background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }
              }
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[0.6875rem] font-black uppercase tracking-[0.06em] whitespace-nowrap" style={{ background: '#f59e0b', color: '#000' }}>最受欢迎</div>
              )}
              <div className="text-xs font-bold uppercase tracking-[0.1em] mb-2.5" style={{ color: '#4b5368' }}>{pkg.name}</div>
              <div className="font-bold leading-none tracking-[-0.04em] mb-1" style={{ fontFamily: 'var(--font-sans)', fontSize: '2.75rem', color: '#f0f4ff' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 500, verticalAlign: 'super', marginRight: 2 }}>¥</span>
                {(pkg.price_fen / 100).toFixed(0)}
              </div>
              <div className="text-xs mb-1.5" style={{ color: '#4b5368' }}>一次性付款</div>
              <div className="text-[0.875rem] mb-6 pb-6" style={{ color: '#8b92a8', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <strong style={{ color: '#fbbf24' }}>{pkg.credits} 积分</strong> · 永久有效
              </div>
              <ul className="space-y-3 mb-7">
                {[`约 ${Math.floor(pkg.credits / 10)} 张图像`, `约 ${Math.floor(pkg.credits / 50)} 段视频`, '全模型可用', '永久有效不过期'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.8125rem]" style={{ color: '#8b92a8' }}>
                    <span style={{ color: '#f59e0b', flexShrink: 0 }}>✦</span>{item}
                  </li>
                ))}
              </ul>
              <a href="/credits"
                className="block w-full rounded-[14px] py-3.5 text-center text-[0.875rem] font-bold transition-all"
                style={pkg.popular
                  ? { background: '#f59e0b', color: '#000' }
                  : { background: '#181d28', color: '#f0f4ff', border: '1px solid rgba(255,255,255,.18)' }
                }
              >
                立即购买
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#4b5368' }}>注册即获得 100 免费积分 · 无需信用卡 · 失败自动退款</p>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="mx-auto max-w-[1280px] px-6 py-20 reveal-section">
        <div className="mb-9">
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>用户口碑</div>
          <h2 className="font-bold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>来自真实创作者的反馈</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: 'x mandatory' }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex-shrink-0 w-[340px] rounded-[20px] p-6" style={{ scrollSnapAlign: 'start', background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="text-[0.875rem] mb-3 tracking-[2px]" style={{ color: '#f59e0b' }}>★★★★★</div>
              <p className="text-[0.875rem] leading-[1.65] mb-5" style={{ color: '#8b92a8' }}>「{t.quote}」</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: t.avatarBg, color: '#000' }}>{t.avatar}</div>
                <div>
                  <div className="text-[0.875rem] font-semibold" style={{ color: '#f0f4ff' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: '#4b5368' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section className="mx-auto max-w-3xl px-6 py-20 reveal-section">
        <div className="text-center mb-10">
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#f59e0b' }}>常见问题</div>
          <h2 className="font-bold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.25rem)', color: '#f0f4ff' }}>还有疑问？</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-[20px] p-5 transition-colors" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }}
              onToggle={(e) => ((e.currentTarget.style.borderColor = (e.currentTarget as HTMLDetailsElement).open ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.08)'))}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold" style={{ color: '#f0f4ff' }}>
                {f.q}
                <span className="ml-4 flex-shrink-0 transition-transform group-open:rotate-45" style={{ color: '#f59e0b' }}>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: '#8b92a8' }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <div className="mx-6 mb-20 rounded-[28px] p-16 text-center relative overflow-hidden reveal-section"
        style={{ background: '#12161f', border: '1px solid rgba(245,158,11,.25)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 120%,rgba(245,158,11,.12) 0%,transparent 70%)' }} />
        <h2 className="relative font-bold tracking-[-0.03em] mb-4" style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.75rem,4vw,2.75rem)', color: '#f0f4ff' }}>
          注册即送 <span style={{ color: '#f59e0b' }}>100 积分</span><br />开启你的 AI 创作之旅
        </h2>
        <p className="relative mb-8" style={{ fontSize: '1rem', color: '#8b92a8' }}>无需订阅 · 积分永久有效 · 随时可用</p>
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          <a href="/register" className="rounded-full px-8 py-3.5 text-[0.9375rem] font-bold transition-all hover:scale-[1.04]" style={{ background: '#f59e0b', color: '#000', border: 'none' }}>
            免费开始创作 →
          </a>
          <a href="/explore" className="rounded-full px-8 py-3.5 text-[0.9375rem] font-bold transition-colors" style={{ background: 'transparent', color: '#8b92a8', border: '1px solid rgba(255,255,255,.18)' }}>
            查看全部模型
          </a>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer className="mx-auto max-w-[1280px] px-6 pt-12 pb-8" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div className="grid grid-cols-2 gap-10 mb-10 sm:grid-cols-4">
          <div>
            <div className="font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-sans)', color: '#f0f4ff' }}>
              iHui<span style={{ color: '#f59e0b' }}>Token</span>
            </div>
            <p className="text-[0.8125rem] leading-[1.6]" style={{ color: '#4b5368', maxWidth: 240 }}>一站式超级 AI 创作平台，集成全球顶级模型，让每个人都能创作出色内容。</p>
          </div>
          {[
            { title: '产品', links: [{ label: 'AI 对话', href: '/chat' }, { label: '图像生成', href: '/image' }, { label: '视频生成', href: '/video' }, { label: '创作室', href: '/studio' }] },
            { title: '资源', links: [{ label: '定价方案', href: '/pricing' }, { label: '灵感社区', href: '/community' }, { label: '模型探索', href: '/explore' }, { label: '关于我们', href: '/about' }] },
            { title: '法律', links: [{ label: '隐私政策', href: '/privacy' }, { label: '服务条款', href: '/terms' }, { label: '联系我们', href: 'mailto:support@ihuitoken.com' }] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[0.8125rem] font-bold mb-3.5" style={{ color: '#f0f4ff' }}>{col.title}</div>
              {col.links.map((l) => (
                <a key={l.label} href={l.href} className="block text-[0.8125rem] mb-2 no-underline transition-colors hover:text-[#8b92a8]" style={{ color: '#4b5368' }}>{l.label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div className="text-xs" style={{ color: '#4b5368' }}>© {new Date().getFullYear()} 杭州汇词元科技有限公司</div>
          <div className="text-xs" style={{ color: '#4b5368' }}>浙ICP备XXXXXXXX号</div>
        </div>
      </footer>

    </div>
  );
}
