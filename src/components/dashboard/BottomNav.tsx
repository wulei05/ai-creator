'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, MessageSquare, Image, Video, Users, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/explore',   icon: Compass,         label: '探索' },
  { href: '/chat',      icon: MessageSquare,   label: '会话' },
  { href: '/image',     icon: Image,           label: '图像' },
  { href: '/video',     icon: Video,           label: '视频' },
  { href: '/studio',    icon: LayoutDashboard, label: '创作室' },
  { href: '/community', icon: Users,           label: '社区' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('h-[18px] w-[18px]', active && 'stroke-[2.5px]')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
