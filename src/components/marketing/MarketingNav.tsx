'use client'

import {
  ChevronDownIcon,
  ImageIcon,
  VideoIcon,
  MessageSquareIcon,
  LayoutDashboardIcon,
  WandSparklesIcon,
  ScissorsIcon,
  Eraser,
  Maximize2,
  Users,
  History,
} from 'lucide-react'

type MenuItem = {
  icon: typeof ImageIcon
  label: string
  desc: string
  href: string
  badge?: string
}

const IMAGE_ITEMS: MenuItem[] = [
  { icon: ImageIcon,       label: '文本转图片',  desc: '从文本生成图像',  href: '/image' },
  { icon: WandSparklesIcon,label: '图像生图像',  desc: '转换一张图像',    href: '/image', badge: '🔥' },
  { icon: Maximize2,       label: '智能扩图',    desc: '扩展图像边界',    href: '/image' },
  { icon: Eraser,          label: '移除背景',    desc: '一键扣图',        href: '/image' },
  { icon: ScissorsIcon,    label: '移除物体',    desc: '精确擦除',        href: '/image' },
]

const VIDEO_ITEMS: MenuItem[] = [
  { icon: VideoIcon,       label: '文本转视频',  desc: '从文本创建视频',  href: '/video' },
  { icon: WandSparklesIcon,label: '图片转视频',  desc: '为静态图像添加动画', href: '/video', badge: '🔥' },
  { icon: Users,           label: '视频换人',    desc: '交换面孔/角色',   href: '/video' },
]

const ASSIST_ITEMS: MenuItem[] = [
  { icon: MessageSquareIcon, label: 'AI 会话',     desc: '智能对话机器人',  href: '/chat' },
  { icon: LayoutDashboardIcon, label: '创作室',   desc: '统一管理你的作品', href: '/studio' },
  { icon: Users,             label: '灵感社区',    desc: '查看全球作品',    href: '/community' },
  { icon: History,           label: '历史记录',    desc: '我的创作记录',    href: '/history' },
]

function MenuColumn({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div>
      <p className="mb-3 text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-1">
        {items.map(({ icon: Icon, label, desc, href, badge }) => (
          <a
            key={label}
            href={href}
            className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-card transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{label}</p>
                {badge && <span className="text-xs">{badge}</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

function NavDropdown({
  label,
  children,
}: {
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors">
        {label}
        <ChevronDownIcon className="h-3 w-3 opacity-60 group-hover:rotate-180 transition-transform" />
      </button>
      <div className="absolute left-1/2 top-full -translate-x-1/2 pt-2 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto">
        {children}
      </div>
    </div>
  )
}

export function MarketingNav() {
  return (
    <nav className="hidden md:flex items-center gap-1">
      <NavDropdown label="探索">
        <div className="grid w-[640px] grid-cols-3 gap-x-6 gap-y-2 rounded-2xl border border-border bg-popover p-5 shadow-xl">
          <MenuColumn title="图片生成" items={IMAGE_ITEMS} />
          <MenuColumn title="视频创作" items={VIDEO_ITEMS} />
          <MenuColumn title="助手"     items={ASSIST_ITEMS} />
        </div>
      </NavDropdown>

      <a
        href="/community"
        className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
      >
        灵感社区
      </a>

      <a
        href="/pricing"
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
      >
        价格方案
        <span className="ml-0.5 text-xs">🎁</span>
      </a>
    </nav>
  )
}

