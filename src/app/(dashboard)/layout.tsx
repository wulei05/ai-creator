import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/SidebarNav'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { UserMenu } from '@/components/dashboard/UserMenu'

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
          <div />
          <UserMenu user={user} />
        </header>
        {/* 移动端底部留出空间 */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      {/* 移动端底部导航 */}
      <BottomNav />
    </div>
  )
}
