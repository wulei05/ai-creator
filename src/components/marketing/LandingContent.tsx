import Image from 'next/image'
import {
  CheckIcon,
  ArrowRightIcon,
  MessageSquareIcon,
  ImageIcon,
  VideoIcon,
  LayoutDashboardIcon,
} from 'lucide-react'
import { PACKAGES } from '@/lib/pricing'

const packageList = Object.entries(PACKAGES).map(([id, pkg]) => ({ id, ...pkg }))

const MODEL_TILES = [
  { name: 'GPT-4o',        tag: '聊天',  href: '/chat',  url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80' },
  { name: 'Claude Sonnet', tag: '聊天',  href: '/chat',  url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80' },
  { name: 'DeepSeek R1',   tag: '推理',  href: '/chat',  url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', badge: 'NEW' },
  { name: 'Gemini 2.5',    tag: '聊天',  href: '/chat',  url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80' },
  { name: 'Qwen Max',      tag: '聊天',  href: '/chat',  url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&q=80' },
  { name: 'Kimi 128K',     tag: '长文',  href: '/chat',  url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80' },
  { name: 'Nano Banana',   tag: '图像',  href: '/image', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80', badge: 'NEW' },
  { name: 'Flux Pro',      tag: '图像',  href: '/image', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80' },
  { name: 'Imagen 4',      tag: '图像',  href: '/image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { name: 'GPT Image 2',   tag: '图像',  href: '/image', url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80' },
  { name: 'Seedance 2',    tag: '视频',  href: '/video', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80', badge: 'HOT' },
  { name: 'Kling 2.6',     tag: '视频',  href: '/video', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80' },
  { name: 'Veo 3.1',       tag: '视频',  href: '/video', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  { name: 'Wan 2.2',       tag: '视频',  href: '/video', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80' },
]

const PROVIDERS = [
  'OpenAI', 'Anthropic', 'Google DeepMind', 'DeepSeek',
  'Alibaba 通义', '智谱 GLM', '月之暗面 Kimi', 'xAI Grok',
  'fal.ai Flux', '快手可灵 Kling', 'ByteDance Seedance', 'Google Veo',
]

const HOT_PROMPTS = [
  '商业级产品白底图',  'Q 版头像贴纸',  '科幻电影海报',
  '小红书封面九宫格',  '抖音短视频开头', '极简扁平插画',
  '工业设计渲染图',    '动态壁纸生成',  '人像换脸合成',
  '动漫角色立绘',      '建筑效果图',    '美食大片',
  '极光夜景',          '宠物拟人化',    '复古胶片质感',
]

const USE_CASES = [
  { title: '电商团队',     desc: '商品图 / 主图 / 详情页一键生成', img: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80' },
  { title: '自媒体博主',   desc: '封面 / 短视频 / 配图全打通',     img: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&q=80' },
  { title: '设计师',       desc: '灵感稿 / 配色 / 风格快速试错',   img: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=600&q=80' },
  { title: '教育培训',     desc: '动画课件 / 知识图谱可视化',       img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80' },
  { title: '游戏开发',     desc: 'NPC 立绘 / UI 素材 / 剧本',       img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80' },
  { title: '独立创业者',   desc: '一个人撑起内容生产线',            img: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80' },
]

const FAQS = [
  { q: '注册后可以免费使用吗？', a: '可以。注册即送 100 积分，足够生成约 10 张图像或 2 段视频，足够你体验全部功能。' },
  { q: '支持哪些 AI 模型？',     a: '集成了 OpenAI / Anthropic / Google / DeepSeek / 阿里通义 / 智谱 / 月之暗面 / xAI / fal.ai / 快手可灵 / Google Veo 等 100+ 主流模型，且持续接入新模型。' },
  { q: '积分如何计算？',         a: '不同模型按调用复杂度扣费，1 张图像约 1–5 积分，1 段视频约 50–200 积分。所有费用前置展示，无隐藏扣费。' },
  { q: '生成的作品商用版权归谁？', a: '商用版权归你个人/企业所有。我们保留服务运行所需的最小展示授权。' },
  { q: '与单独购买各家 API 相比有何优势？', a: '免去多平台注册和充值；统一额度池；模型切换无缝；价格通常低于官方价。' },
  { q: '支持团队/企业账号吗？',   a: '支持。Pro 及以上方案可开通成员席位、共享额度池、权限管理与企业发票。' },
  { q: '生成失败会扣积分吗？',   a: '失败任务自动退还积分，不影响你的额度。' },
  { q: '如何升级 / 取消订阅？',   a: '在「积分」页随时升级或一次性购买积分包，无月费、无最低消费，按需使用。' },
]

const TOOLS = [
  { icon: MessageSquareIcon,  label: '智能对话', desc: '多模型 AI 助手',                href: '/chat'   },
  { icon: ImageIcon,          label: '图像生成', desc: 'Flux / Imagen / Nano Banana',  href: '/image'  },
  { icon: VideoIcon,          label: '视频生成', desc: 'Kling / Seedance / Veo',       href: '/video'  },
  { icon: LayoutDashboardIcon, label: '创作室',  desc: '统一管理你的作品',              href: '/studio' },
]

const STATS = [
  { value: '100+',  label: '顶级 AI 模型' },
  { value: '5 万+', label: '月活创作者' },
  { value: '200 万+', label: '累计创作作品' },
  { value: '4.9',  label: '平均满意度' },
]

const INSPIRATIONS = [
  { title: '电商级产品渲染', desc: '让产品图瞬间吸引眼球',           url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80' },
  { title: '动漫风格转换',   desc: '把照片秒变二次元',               url: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&q=80' },
  { title: '美食大片',       desc: '商业级食物摄影',                 url: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80' },
  { title: '野生自然写真',   desc: '高清动物特写',                   url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&q=80' },
  { title: '赛博朋克都市',   desc: '霓虹未来风',                     url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80' },
  { title: '极致风光摄影',   desc: '云海与雪山的诗',                 url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80' },
  { title: '未来概念设计',   desc: '机器人与赛博美学',               url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80' },
  { title: '仙境山水',       desc: '水墨与梦境的交融',               url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80' },
  { title: '人像写真',       desc: '高质感专业人像',                 url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80' },
  { title: '海浪冲击',       desc: '惊涛拍岸的震撼',                 url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80' },
  { title: '奇幻森林',       desc: '童话般的光与影',                 url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80' },
  { title: '星空宇宙',       desc: '银河与星云的史诗',               url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=80' },
  { title: '复古胶片',       desc: '颗粒感的时光氛围',               url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80' },
  { title: '街头时尚',       desc: '潮流人像写真',                   url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80' },
  { title: '科技概念',       desc: '极简未来界面',                   url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80' },
  { title: '极光夜景',       desc: '梦幻自然奇观',                   url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' },
]

const TESTIMONIALS = [
  { name: '张涛',     role: '资深设计师',     quote: '甲方天天改需求，现在 1 分钟出 10 版方案，过稿率高了 3 倍。' },
  { name: '林书涵',   role: '自媒体博主',     quote: '靠 IHuiToken 做封面图，涨粉速度比之前快了 5 倍，关键是不用学 PS。' },
  { name: '阿俊',     role: '跨境电商',       quote: 'Nano Banana Pro 出的产品图直接上 Shopify，转化比原图高 28%。' },
  { name: '王老师',   role: '教培老师',       quote: '用 Kling 给学生做动画课件，孩子注意力肉眼可见地集中了。' },
  { name: '赵子轩',   role: '短视频创作者',   quote: 'Seedance 2 出的镜头质感比我手动剪的还好，30 秒就出片。' },
  { name: '苏苏',     role: '独立游戏开发',   quote: '美术外包的钱省了，DeepSeek 写代码，一个人撑起整个项目。' },
  { name: '陈淼',     role: '广告策划',       quote: '一次比稿要 5 套方案，IHuiToken 半小时就出齐，老板以为我加班到深夜。' },
  { name: '李一帆',   role: 'UI 设计师',      quote: '想到什么直接生成参考图，比翻 Pinterest 高效一万倍。' },
  { name: '周婷婷',   role: '品牌运营',       quote: '一个人撑起了公司全部社交媒体配图，月预算降了 80%。' },
]

export function LandingContent() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center sm:pt-24">
        <Image
          src="/logo.png"
          alt="IHuiToken"
          width={96}
          height={76}
          className="mb-6 h-16 w-auto sm:h-20"
          priority
        />

        <h1 className="mb-6 text-4xl font-bold leading-[1.2] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="block">从平凡到非凡</span>
          <span className="block mt-1">一站式超级 AI 创作</span>
        </h1>

        <p className="mb-8 max-w-xl text-base text-muted-foreground sm:text-lg">
          集成 GPT、Claude、DeepSeek、Flux、Kling 等顶级模型，一个平台搞定图像、视频、对话。
        </p>

        <a
          href="/chat"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          开始创作
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>

        <a
          href="/credits"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <span>🎉 注册即送 100 免费积分</span>
          <span className="text-primary">立即领取 →</span>
        </a>
      </section>

      {/* Model Carousel */}
      <section className="relative overflow-hidden py-8">
        <div className="flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {MODEL_TILES.map((m) => (
            <a
              key={m.name}
              href={m.href}
              className="group relative flex h-56 w-44 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border transition-transform hover:scale-[1.02]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              {m.badge && (
                <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {m.badge}
                </span>
              )}
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-sm font-semibold text-white">{m.name}</p>
                <p className="text-xs text-white/60">{m.tag}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Hot prompts tag cloud */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            热门提示词
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {HOT_PROMPTS.map((p) => (
              <a
                key={p}
                href="/image"
                className="rounded-full border border-border bg-card/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                {p}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Provider logos strip */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card/30 px-6 py-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            由全球 100+ 顶级模型驱动
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {PROVIDERS.map((p) => (
              <span key={p} className="font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card/60 border border-border/60 px-4 py-5 text-center">
              <div className="text-2xl font-bold text-foreground sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools card */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-card border border-border p-8 sm:p-12">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-0.5 text-[11px] font-semibold text-primary">
              CORE
            </span>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">最便捷的 AI 生产力工具</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              专业 AI 创作能力，一站式覆盖你的所有需求
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TOOLS.map(({ icon: Icon, label, desc, href }) => (
              <a
                key={label}
                href={href}
                className="group flex flex-col items-start gap-3 rounded-2xl bg-background/60 border border-border/60 p-5 transition-colors hover:border-primary/40 hover:bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary/25 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href="/chat"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              立即尝试
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Inspiration gallery */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">来自全世界的灵感</h2>
            <p className="mt-2 text-sm text-muted-foreground">想做什么？这些方向也许会给你启发</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {INSPIRATIONS.map((it) => (
              <a
                key={it.title}
                href="/image"
                className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-border transition-transform hover:scale-[1.02]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-sm font-semibold text-white">{it.title}</p>
                  <p className="mt-0.5 text-xs text-white/60">{it.desc}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="/community"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card/60 px-6 text-sm font-medium text-foreground hover:bg-card transition-colors"
            >
              查看更多灵感
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">谁在用 IHuiToken</h2>
            <p className="mt-2 text-sm text-muted-foreground">从个体到团队，从创意到生产，AI 全流程提速</p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <a
                key={u.title}
                href="/chat"
                className="group relative h-48 overflow-hidden rounded-2xl ring-1 ring-border transition-transform hover:scale-[1.02]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.img} alt={u.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-base font-semibold text-white">{u.title}</p>
                  <p className="mt-0.5 text-xs text-white/70">{u.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">来自全世界用户的好评</h2>
            <p className="mt-2 text-sm text-muted-foreground">真实创作者，真实成果</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/40"
              >
                <div className="mb-3 flex items-center gap-2 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} aria-hidden>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-semibold">
                    {t.name.slice(-1)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">简单透明的定价</h2>
            <p className="text-sm text-muted-foreground">按需购买积分，无月费，无订阅</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packageList.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border p-6 transition-colors ${
                  pkg.popular
                    ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                    : 'border-border bg-card/40 hover:border-border'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold">{pkg.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">¥{(pkg.price_fen / 100).toFixed(0)}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-2 border-t border-border pt-4">
                  {[
                    `${pkg.credits} 积分`,
                    `可生成约 ${Math.floor(pkg.credits / 10)} 张图像`,
                    `或 ${Math.floor(pkg.credits / 50)} 段视频`,
                    '永久有效',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckIcon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="/credits"
                  className={`block w-full rounded-full py-2.5 text-center text-sm font-medium transition-opacity ${
                    pkg.popular
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'border border-border text-foreground hover:bg-card'
                  }`}
                >
                  立即购买
                </a>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            注册即获得 100 免费积分，无需信用卡
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">常见问题</h2>
            <p className="mt-2 text-sm text-muted-foreground">还有疑问？联系 support@ihuitoken.com</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                  {f.q}
                  <span className="ml-4 text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">立即开始你的 AI 创作之旅</h2>
          <p className="mb-8 text-sm text-muted-foreground">无需信用卡，无需订阅，注册即送 100 积分</p>
          <a
            href="/chat"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            开始使用
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="text-base font-semibold text-foreground">
            IHuiToken
          </a>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} IHuiToken. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/chat" className="hover:text-foreground transition-colors">对话</a>
            <a href="/image" className="hover:text-foreground transition-colors">图像</a>
            <a href="/video" className="hover:text-foreground transition-colors">视频</a>
            <a href="/#pricing" className="hover:text-foreground transition-colors">价格</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
