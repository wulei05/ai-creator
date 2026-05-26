'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthGate } from '@/lib/auth-gate'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { History, LogOut, Coins } from 'lucide-react'

export function UserMenu({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()
  const { openModal } = useAuthGate()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/credits/balance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.balance === 'number') setBalance(d.balance) })
      .catch(() => {})
  }, [user])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) {
    return (
      <Button size="sm" onClick={openModal}>
        登录
      </Button>
    )
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-transparent border-none p-0 cursor-pointer">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/history')} className="cursor-pointer">
          <History className="mr-2 h-4 w-4" />
          历史记录
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/credits')} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          <span className="flex-1">积分</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {balance === null ? '…' : balance}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
