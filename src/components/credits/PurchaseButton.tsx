'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PurchaseButton({ packageId }: { packageId: string }) {
  const [loading, setLoading] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: packageId }),
    })
    const data = await res.json()
    if (data.pay_url) {
      window.open(data.pay_url, '_blank')
    }
    setLoading(false)
  }

  return (
    <Button className="w-full" size="sm" onClick={handlePurchase} disabled={loading}>
      {loading ? '跳转中...' : '购买'}
    </Button>
  )
}
