'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Image, Video, History, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/chat',    icon: MessageSquare, label: 'AI 对话' },
  { href: '/image',   icon: Image,         label: 'AI 图像' },
  { href: '/video',   icon: Video,         label: 'AI 视频' },
  { href: '/history', icon: History,       label: '历史' },
  { href: '/credits', icon: Coins,         label: '积分' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
              active
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5px]')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
