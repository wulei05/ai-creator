import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { AuthGateProvider } from '@/lib/auth-gate'
import { AuthModal } from '@/components/auth/AuthModal'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthGateProvider user={user}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <a href="/" className="flex items-center gap-2 text-base font-semibold shrink-0">
              <Image src="/logo.png" alt="IHuiToken" width={32} height={26} className="h-7 w-auto" priority />
              IHuiToken
            </a>

            <MarketingNav />

            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                <UserMenu user={user} />
              ) : (
                <>
                  <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    登录
                  </a>
                  <a
                    href="/register"
                    className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    免费注册
                  </a>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="pt-[57px]">{children}</main>
        <AuthModal />
      </div>
    </AuthGateProvider>
  )
}
