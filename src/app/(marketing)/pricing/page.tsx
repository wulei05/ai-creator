import { CheckIcon, ArrowRightIcon, ZapIcon, ShieldIcon, HeadphonesIcon, InfinityIcon } from 'lucide-react';
import { PACKAGES } from '@/lib/pricing';

const packageList = Object.entries(PACKAGES).map(([id, pkg]) => ({ id, ...pkg }));

const FEATURES = [
  { icon: ZapIcon,         title: '即充即用',       desc: '购买后积分立即到账，无需等待审核，无有效期限制。' },
  { icon: InfinityIcon,    title: '100+ 顶级模型',  desc: '一个账号访问 OpenAI、Anthropic、Google、DeepSeek 等全部主流模型。' },
  { icon: ShieldIcon,      title: '商用版权保障',   desc: '生成内容版权归你所有，可放心用于商业项目。' },
  { icon: HeadphonesIcon,  title: '失败自动退积分', desc: '任务失败自动原路退还积分，零损失保障。' },
];

const CREDIT_GUIDE = [
  { type: '图像生成',  examples: ['Flux Schnell — 3 积分/张', 'Flux Pro — 10 积分/张', 'Imagen 4 Ultra — 15 积分/张'] },
  { type: '视频生成',  examples: ['Kling v1.6 — 25 积分/段', 'Veo 3 — 80 积分/段', 'Kling v2.6 — 70 积分/段'] },
  { type: 'AI 对话',   examples: ['DeepSeek / Gemini Flash — 1 积分/次', 'Claude Sonnet — 2 积分/次', 'Gemini Pro — 3 积分/次'] },
];

const FAQS = [
  { q: '积分会过期吗？',           a: '不会。积分永久有效，随时使用，无任何时效限制。' },
  { q: '生成失败会扣积分吗？',     a: '不会。失败任务自动退还全部积分，完全无损。' },
  { q: '可以多人共用一个账号吗？', a: '可以，积分共享。如需权限隔离，企业方案支持多席位管理。' },
  { q: '能开发票吗？',             a: '支持，请联系 support@ihuitoken.com 申请企业发票。' },
  { q: '注册有免费积分吗？',       a: '有。新用户注册即送 100 积分，可生成约 10 张图像或体验对话功能。' },
  { q: '与直接购买各家 API 有何区别？', a: '无需多平台注册、充值；统一额度管理；模型随时切换；价格通常优于官方单购。' },
];

export default function PricingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="px-4 pt-20 pb-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary mb-4">
          简单透明定价
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl mb-4">
          按需购买，按量付费
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          无月费，无订阅，无隐藏扣费。一次购买，永久有效。
          注册即送 100 积分，免费体验全部功能。
        </p>
      </section>

      {/* Packages */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packageList.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border p-6 transition-colors ${
                pkg.popular
                  ? 'border-primary bg-primary/8 ring-1 ring-primary/40'
                  : 'border-border bg-card/40 hover:border-border/80'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    最受欢迎
                  </span>
                </div>
              )}

              <h3 className="text-base font-semibold">{pkg.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">¥{(pkg.price_fen / 100).toFixed(0)}</span>
              </div>

              <ul className="my-5 space-y-2 border-t border-border pt-4">
                {[
                  `${pkg.credits} 积分`,
                  `约 ${Math.floor(pkg.credits / 10)} 张精品图像`,
                  `或 ${Math.floor(pkg.credits / 50)} 段 AI 视频`,
                  '永久有效，不过期',
                  '全部 100+ 模型可用',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/credits"
                className={`flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-opacity ${
                  pkg.popular
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-card'
                }`}
              >
                立即购买
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          注册即获得 100 免费积分 · 无需信用卡 · 失败自动退款
        </p>
      </section>

      {/* Features */}
      <section className="px-4 py-16 border-t border-border/40">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">为什么选择 IHuiToken</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card/40 p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit consumption guide */}
      <section className="px-4 py-16 border-t border-border/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">积分消耗参考</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            不同模型按调用复杂度扣费，价格前置展示，无任何隐藏扣费
          </p>
          <div className="space-y-4">
            {CREDIT_GUIDE.map(({ type, examples }) => (
              <div key={type} className="rounded-2xl border border-border bg-card/40 p-5">
                <h3 className="mb-3 text-sm font-semibold text-primary">{type}</h3>
                <ul className="space-y-1.5">
                  {examples.map((ex) => (
                    <li key={ex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 border-t border-border/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">常见问题</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card/40 p-5 transition-colors hover:border-primary/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                  {f.q}
                  <span className="ml-4 text-primary transition-transform group-open:rotate-45 shrink-0">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 border-t border-border/40">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-bold">现在开始，免费体验</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            注册即送 100 积分，无需信用卡，随时购买追加
          </p>
          <a
            href="/register"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            免费注册领积分
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <a href="/" className="text-base font-semibold text-foreground">IHuiToken</a>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} IHuiToken. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/chat"      className="hover:text-foreground transition-colors">对话</a>
            <a href="/image"     className="hover:text-foreground transition-colors">图像</a>
            <a href="/video"     className="hover:text-foreground transition-colors">视频</a>
            <a href="/pricing"   className="hover:text-foreground transition-colors">价格</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
