import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { Sparkles } from 'lucide-react'
import { Toaster } from 'sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-background">
      {/* 桌面侧边栏 */}
      <div className="hidden md:flex">
        <SidebarNav />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4">
          {/* 移动端显示 logo，桌面端侧边栏已有 */}
          <div className="flex items-center gap-1.5 md:hidden">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">AI Creator</span>
          </div>
          <div className="hidden md:block" />
          <UserMenu user={user} />
        </header>
        {/* 移动端底部留出空间 */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6">
          {children}
        </main>
      </div>
      {/* 移动端底部导航 */}
      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  )
}
