'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PurchaseButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })
      const data = await res.json() as { pay_url?: string; error?: string }
      if (!res.ok || !data.pay_url) {
        setError(data.error ?? '创建订单失败，请重试')
        return
      }
      window.open(data.pay_url, '_blank')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button className="w-full" size="sm" onClick={handlePurchase} disabled={loading}>
        {loading ? '跳转中...' : '购买'}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
