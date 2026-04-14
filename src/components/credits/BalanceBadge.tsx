'use client'

import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import Link from 'next/link'

export function BalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(d => setBalance(d.balance))
      .catch(() => {})
  }, [])

  return (
    <Link
      href="/credits"
      className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
    >
      <Coins className="h-3.5 w-3.5" />
      {balance === null ? '...' : `${balance} 积分`}
    </Link>
  )
}
