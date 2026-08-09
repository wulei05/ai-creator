import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getModelContent, ALL_MODEL_IDS } from '@/lib/model-info'

export async function generateStaticParams() {
  return ALL_MODEL_IDS.map((id) => ({ id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const m = getModelContent(id)
  if (!m) return { title: '模型未找到' }
  return {
    title: `${m.label} — ${m.provider} | iHuiToken`,
    description: m.description.slice(0, 155),
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  chat: 'AI 对话',
  image: '图像生成',
  video: '视频生成',
}

const CATEGORY_HREF: Record<string, string> = {
  chat: '/chat',
  image: '/image',
  video: '/video',
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = getModelContent(id)
  if (!m) notFound()

  const useHref = `${CATEGORY_HREF[m.category]}?model=${m.id}`

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[900px] px-6 pt-16 pb-12">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <a href="/explore" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← 返回探索</a>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[m.category]}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Icon */}
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
            style={{ background: `${m.color}18`, border: `1px solid ${m.color}40` }}
          >
            {m.category === 'chat' ? '💬' : m.category === 'image' ? '🎨' : '🎬'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>
                {m.provider}
              </span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-border/40">
                {CATEGORY_LABEL[m.category]}
              </span>
              {m.badge && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)' }}>
                  {m.badge}
                </span>
              )}
            </div>
            <h1 className="font-bold tracking-[-0.03em] mb-2" style={{ fontSize: 'clamp(1.8rem,4vw,2.75rem)', color: '#f0f4ff' }}>
              {m.label}
            </h1>
            <p className="text-base leading-[1.6]" style={{ color: '#8b92a8' }}>{m.tagline}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 mt-8 flex-wrap">
          <a
            href={useHref}
            className="rounded-full px-7 py-3 text-sm font-bold transition-all hover:scale-[1.03]"
            style={{ background: '#f59e0b', color: '#000' }}
          >
            立即使用 {m.label} →
          </a>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#4b5368' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
            {m.credits} 积分 / 次
          </div>
        </div>
      </section>

      {/* ── Description ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-12">
        <div className="rounded-[20px] p-7 text-[0.9375rem] leading-[1.8]" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)', color: '#8b92a8' }}>
          {m.description}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-12">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>核心能力</div>
        <h2 className="font-bold tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', color: '#f0f4ff' }}>为什么选择 {m.label}？</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {m.features.map((f) => (
            <div key={f.title} className="rounded-[16px] p-5 flex gap-4" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <div className="font-semibold mb-1 text-sm" style={{ color: '#f0f4ff' }}>{f.title}</div>
                <p className="text-xs leading-[1.7]" style={{ color: '#8b92a8' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Specs ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-12">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>技术规格</div>
        <h2 className="font-bold tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', color: '#f0f4ff' }}>参数一览</h2>
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.06)' }}>
          {m.specs.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: i % 2 === 0 ? '#0d1017' : '#0a0d14',
                borderBottom: i < m.specs.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
              }}
            >
              <span className="text-sm" style={{ color: '#4b5368' }}>{s.label}</span>
              <span className="text-sm font-medium" style={{ color: '#f0f4ff' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-12">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>使用场景</div>
        <h2 className="font-bold tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', color: '#f0f4ff' }}>典型提示词示例</h2>
        <div className="space-y-3">
          {m.useCases.map((uc) => (
            <a
              key={uc.title}
              href={`${CATEGORY_HREF[m.category]}?model=${m.id}&prompt=${encodeURIComponent(uc.prompt)}`}
              className="group block rounded-[16px] p-5 transition-all hover:-translate-y-0.5"
              style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${m.color}12`, color: m.color, border: `1px solid ${m.color}30` }}>
                  {uc.title}
                </span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#f59e0b' }}>点击直接使用 →</span>
              </div>
              <p className="text-sm leading-[1.7] font-mono" style={{ color: '#8b92a8' }}>{uc.prompt}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-12">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>常见问题</div>
        <h2 className="font-bold tracking-[-0.03em] mb-6" style={{ fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', color: '#f0f4ff' }}>你可能想问</h2>
        <div className="space-y-3">
          {m.faqs.map((faq) => (
            <details key={faq.q} className="group rounded-[16px] overflow-hidden" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-medium text-sm list-none" style={{ color: '#f0f4ff' }}>
                {faq.q}
                <span className="text-lg shrink-0 transition-transform group-open:rotate-45" style={{ color: '#4b5368' }}>+</span>
              </summary>
              <p className="px-6 pb-5 text-sm leading-[1.8]" style={{ color: '#8b92a8' }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-[900px] px-6 pb-20">
        <div
          className="rounded-[24px] p-10 text-center"
          style={{ background: 'linear-gradient(160deg,rgba(245,158,11,.07),#0d1017)', border: '1px solid rgba(245,158,11,.2)' }}
        >
          <h2 className="font-bold mb-3" style={{ color: '#f0f4ff', fontSize: '1.5rem' }}>立即体验 {m.label}</h2>
          <p className="mb-7 text-sm" style={{ color: '#8b92a8' }}>注册即送 100 积分，够体验 {Math.floor(100 / m.credits)} 次，无需绑卡</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={useHref}
              className="rounded-full px-8 py-3 text-sm font-bold transition-all hover:scale-[1.04]"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              开始使用
            </a>
            <a
              href="/register"
              className="rounded-full px-8 py-3 text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: '#12161f', color: '#f0f4ff', border: '1px solid rgba(255,255,255,.1)' }}
            >
              免费注册
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
