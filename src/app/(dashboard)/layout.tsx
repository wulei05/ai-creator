import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { AuthGateProvider } from '@/lib/auth-gate'
import { AuthModal } from '@/components/auth/AuthModal'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthGateProvider user={user}>
      <div className="flex h-screen bg-background">
        {/* 桌面侧边栏 */}
        <div className="hidden md:flex">
          <SidebarNav user={user} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 移动端顶栏：品牌 + 头像 */}
          <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
            <Link href="/" className="flex items-center gap-1.5">
              <Image src="/logo.png" alt="IHuiToken" width={28} height={22} className="h-6 w-auto" priority />
              <span className="font-semibold text-sm">IHuiToken</span>
            </Link>
            <UserMenu user={user} />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6">
            {children}
          </main>
        </div>
        <BottomNav />
        <Toaster richColors position="top-center" />
        <AuthModal />
      </div>
    </AuthGateProvider>
  )
}
