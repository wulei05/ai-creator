import { createClient } from '@/lib/supabase/server'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { AuthGateProvider } from '@/lib/auth-gate'
import { AuthModal } from '@/components/auth/AuthModal'
import { ParticleCanvas } from '@/components/marketing/ParticleCanvas'
import { getSiteBranding } from '@/lib/site-branding'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { siteName } = await getSiteBranding()

  return (
    <AuthGateProvider user={user}>
      <div className="v2-noise relative min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Background radial glows */}
        <div className="v2-bg-glow" style={{ width: 700, height: 700, background: 'rgba(245,158,11,.06)', top: -200, left: -200 }} />
        <div className="v2-bg-glow" style={{ width: 600, height: 600, background: 'rgba(103,232,249,.04)', top: '50%', right: -200, transform: 'translateY(-50%)' }} />
        <div className="v2-bg-glow" style={{ width: 500, height: 500, background: 'rgba(251,113,133,.04)', bottom: -100, left: '30%' }} />

        {/* Particle canvas */}
        <ParticleCanvas />

        {/* ── Nav ── */}
        <header
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08]"
          style={{ background: 'rgba(8,10,15,.85)', backdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <nav className="mx-auto flex max-w-[1280px] items-center px-6 h-[60px] gap-0">
            {/* Logo */}
            <a href="/" className="mr-10 shrink-0 font-bold text-[1.375rem] tracking-[-0.03em] text-foreground no-underline">
              iHui<span style={{ background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Token</span>
            </a>

            {/* Center nav tabs */}
            <MarketingNav />

            {/* Right */}
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <a href="/pricing" className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors">定价</a>
              {user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  <a href="/login" className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors">登录</a>
                  <a
                    href="/register"
                    className="rounded-full px-[18px] py-[7px] text-[0.8125rem] font-bold transition-all hover:scale-[1.04]"
                    style={{ background: '#f59e0b', color: '#000' }}
                  >
                    开始创作
                  </a>
                </>
              )}
            </div>
          </nav>
        </header>

        <main className="relative z-[1] pt-[60px]">{children}</main>
        <AuthModal />
      </div>
    </AuthGateProvider>
  )
}
