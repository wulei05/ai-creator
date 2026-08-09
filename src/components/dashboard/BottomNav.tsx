'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, MessageSquare, Image, Video, Users, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT, type TKey } from '@/lib/i18n'

const navItems: { href: string; icon: typeof Compass; labelKey: TKey }[] = [
  { href: '/explore',   icon: Compass,         labelKey: 'nav_explore' },
  { href: '/chat',      icon: MessageSquare,   labelKey: 'nav_chat' },
  { href: '/image',     icon: Image,           labelKey: 'nav_image' },
  { href: '/video',     icon: Video,           labelKey: 'nav_video' },
  { href: '/studio',    icon: LayoutDashboard, labelKey: 'nav_studio' },
  { href: '/community', icon: Users,           labelKey: 'nav_community' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useT()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {navItems.map(({ href, icon: Icon, labelKey }) => {
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
            <span>{t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
