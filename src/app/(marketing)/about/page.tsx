import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于我们 — iHuiToken',
  description: 'iHuiToken 是一站式 AI 超级创作平台，汇聚全球顶级 AI 模型，让每个人都能轻松创作。',
}

const STATS = [
  { n: '100+', label: 'AI 模型' },
  { n: '50,000+', label: '月活创作者' },
  { n: '2,000,000+', label: '累计作品' },
  { n: '4.9', label: '用户满意度' },
]

const FEATURES = [
  {
    icon: '💬',
    title: 'AI 对话',
    desc: '接入 GPT-4o、Claude Sonnet、DeepSeek R1 等全球顶级对话模型，多轮对话、视觉理解、代码生成一应俱全。',
  },
  {
    icon: '🎨',
    title: '图像生成',
    desc: '集成 Flux Pro、Imagen 4 Ultra、GPT Image 2 等 20+ 图像模型，支持参考图输入、多种尺寸输出，商业级品质。',
  },
  {
    icon: '🎬',
    title: '视频生成',
    desc: '接入 Kling v2.6、Seedance 2、Veo 3.1 等顶级视频模型，文生视频、图生视频，最高支持 10 秒高清输出。',
  },
  {
    icon: '✂️',
    title: '精细编辑',
    desc: '扩图、抠图、移除物体等专业编辑能力，无需 Photoshop，一键完成复杂图像处理任务。',
  },
]

const FAQS = [
  {
    q: '积分如何计费？',
    a: '1 积分 = 0.01 元人民币。不同模型消耗不同积分，具体参见定价页面。积分永久有效，无任何过期限制。',
  },
  {
    q: '生成失败会扣积分吗？',
    a: '不会。服务端原因导致的生成失败，积分将自动原路退还，全程无损。',
  },
  {
    q: '与直接购买各家 API 有何区别？',
    a: '无需多平台注册和充值；统一积分池可随时切换模型；价格通常低于各厂商官方单独定价；客服和技术支持更便捷。',
  },
  {
    q: '生成的内容版权归谁？',
    a: '生成内容的著作权归您所有，可用于个人或商业用途。我们不会主张任何权利。',
  },
]

export default function AboutPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="mx-auto max-w-[900px] px-6 pt-20 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.04em] mb-7"
          style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', color: '#fbbf24' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
          关于 iHuiToken
        </div>
        <h1 className="font-bold leading-[1.1] tracking-[-0.04em] mb-6" style={{ fontSize: 'clamp(2.2rem,5vw,4rem)', color: '#f0f4ff' }}>
          让每个人都能用上<br />
          <span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            全球最强 AI
          </span>
        </h1>
        <p className="mx-auto max-w-[560px] leading-[1.7]" style={{ fontSize: '1.0625rem', color: '#8b92a8' }}>
          iHuiToken 诞生于一个简单的信念：顶级 AI 创作能力不应该被技术门槛和高昂费用所阻挡。
          我们将全球 100+ 顶级 AI 模型汇聚于一个平台，用积分制让创作变得触手可及。
        </p>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-[800px] px-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-[20px] p-6 text-center" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="font-bold text-[2rem] leading-none mb-1" style={{ color: '#f59e0b' }}>{s.n}</div>
              <div className="text-xs" style={{ color: '#4b5368' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-[800px] px-6 pb-16">
        <div className="rounded-[24px] p-8 sm:p-12" style={{ background: 'linear-gradient(160deg,rgba(245,158,11,.07),#0d1017)', border: '1px solid rgba(245,158,11,.2)' }}>
          <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: '#f59e0b' }}>我们的使命</div>
          <blockquote className="font-bold tracking-[-0.02em] leading-[1.3] mb-6" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#f0f4ff' }}>
            "降低 AI 创作门槛，让中文世界的创作者平等地获得世界级 AI 能力。"
          </blockquote>
          <p className="leading-[1.8] text-[0.9375rem]" style={{ color: '#8b92a8' }}>
            我们相信，AI 将成为每个创作者的超级助手。无论你是设计师、自媒体人、电商卖家还是学生，
            都应该能以最低的成本体验到 GPT、Claude、Flux、Kling 这些改变世界的模型。
            这就是为什么我们建立了 iHuiToken：一个统一的入口，一套透明的积分体系，无需订阅，按需使用。
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[800px] px-6 pb-16">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>核心能力</div>
        <h2 className="font-bold tracking-[-0.03em] mb-8" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#f0f4ff' }}>一站式 AI 创作工作台</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-[20px] p-6" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold mb-2" style={{ color: '#f0f4ff' }}>{f.title}</div>
              <p className="text-[0.875rem] leading-[1.7]" style={{ color: '#8b92a8' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[800px] px-6 pb-20">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>常见问题</div>
        <h2 className="font-bold tracking-[-0.03em] mb-8" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', color: '#f0f4ff' }}>你可能想知道</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group rounded-[16px] overflow-hidden" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-medium text-[0.9375rem] list-none" style={{ color: '#f0f4ff' }}>
                {faq.q}
                <span className="text-lg text-muted-foreground transition-transform group-open:rotate-45 shrink-0">+</span>
              </summary>
              <p className="px-6 pb-5 text-[0.875rem] leading-[1.8]" style={{ color: '#8b92a8' }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-[800px] px-6 pb-20">
        <div className="rounded-[24px] p-8 text-center" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 className="font-bold mb-3" style={{ color: '#f0f4ff', fontSize: '1.375rem' }}>联系我们</h2>
          <p className="mb-6 text-[0.9375rem]" style={{ color: '#8b92a8' }}>有任何问题或建议？我们很乐意倾听。</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@ihuitoken.com"
              className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.03]"
              style={{ background: '#f59e0b', color: '#000' }}
            >
              发送邮件
            </a>
            <a
              href="/pricing"
              className="rounded-full px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: '#12161f', color: '#f0f4ff', border: '1px solid rgba(255,255,255,.1)' }}
            >
              查看定价
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
