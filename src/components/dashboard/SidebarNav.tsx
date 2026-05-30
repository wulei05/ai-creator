'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Compass, MessageSquare, Image, Video, LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/dashboard/UserMenu'

const navItems = [
  { href: '/explore',   icon: Compass,         label: '探索' },
  { href: '/chat',      icon: MessageSquare,   label: '会话' },
  { href: '/image',     icon: Image,           label: '图像' },
  { href: '/video',     icon: Video,           label: '视频' },
  { href: '/studio',    icon: LayoutDashboard, label: '创作室' },
  { href: '/community', icon: Users,           label: '社区' },
]

export function SidebarNav({
  user,
  logoUrl = '/logo.png',
  siteName = 'IHuiToken',
}: {
  user: User | null
  logoUrl?: string
  siteName?: string
}) {
  const pathname = usePathname()

  return (
    <aside className="flex w-[88px] flex-col items-center bg-sidebar text-sidebar-foreground">
      <Link href="/" className="flex h-14 w-full items-center justify-center">
        <NextImage
          src={logoUrl}
          alt={siteName}
          width={40}
          height={32}
          className="h-8 w-auto"
          priority
          unoptimized={logoUrl.startsWith('http')}
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1 px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex w-full flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.2px]')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex w-full flex-col items-center gap-2 px-2 py-3">
        <UserMenu user={user} />
      </div>
    </aside>
  )
}
