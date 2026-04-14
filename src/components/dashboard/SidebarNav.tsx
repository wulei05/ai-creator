'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Image, Video, LayoutDashboard, Coins, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BalanceBadge } from '@/components/credits/BalanceBadge'

const navItems = [
  { href: '/chat',      icon: MessageSquare,   label: 'AI 对话' },
  { href: '/image',     icon: Image,           label: 'AI 图像' },
  { href: '/video',     icon: Video,           label: 'AI 视频' },
  { href: '/studio',    icon: LayoutDashboard, label: '创作室' },
  { href: '/community', icon: Users,           label: '社区' },
  { href: '/credits',   icon: Coins,           label: '积分' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold">AI Creator</span>
      </div>
      <div className="px-3 py-3">
        <BalanceBadge />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
