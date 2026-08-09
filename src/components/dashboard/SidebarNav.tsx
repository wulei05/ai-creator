'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Compass, MessageSquare, Image, Video, LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { useT, type TKey } from '@/lib/i18n'

const navItems: { href: string; icon: typeof Compass; labelKey: TKey }[] = [
  { href: '/explore',   icon: Compass,         labelKey: 'nav_explore' },
  { href: '/chat',      icon: MessageSquare,   labelKey: 'nav_chat' },
  { href: '/image',     icon: Image,           labelKey: 'nav_image' },
  { href: '/video',     icon: Video,           labelKey: 'nav_video' },
  { href: '/studio',    icon: LayoutDashboard, labelKey: 'nav_studio' },
  { href: '/community', icon: Users,           labelKey: 'nav_community' },
]

function LangToggle() {
  const { lang, setLang } = useT()
  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      className="flex w-full flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
      title={lang === 'zh' ? 'Switch to English' : '切换中文'}
    >
      <span className="text-base leading-none">{lang === 'zh' ? '中' : 'EN'}</span>
      <span>{lang === 'zh' ? 'EN' : '中'}</span>
    </button>
  )
}

export function SidebarNav({
  user,
  logoUrl = '/logo.webp',
  siteName = 'IHuiToken',
}: {
  user: User | null
  logoUrl?: string
  siteName?: string
}) {
  const pathname = usePathname()
  const { t } = useT()

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
        {navItems.map(({ href, icon: Icon, labelKey }) => {
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
              <span>{t(labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex w-full flex-col items-center gap-2 px-2 py-3">
        <LangToggle />
        <UserMenu user={user} />
      </div>
    </aside>
  )
}
