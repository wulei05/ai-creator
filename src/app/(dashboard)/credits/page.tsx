import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PACKAGES } from '@/lib/pricing'
import { PurchaseButton } from '@/components/credits/PurchaseButton'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  const { data: logs } = await supabase
    .from('credit_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">积分</h1>
        <p className="text-muted-foreground">当前余额：{credits?.balance ?? 0} 积分</p>
      </div>

      {/* 套餐 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(PACKAGES).map(([id, pkg]) => (
          <Card key={id} className={pkg.popular ? 'border-primary' : ''}>
            <CardHeader className="pb-2">
              {pkg.popular && <Badge className="w-fit mb-1">推荐</Badge>}
              <CardTitle className="text-base">{pkg.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-2xl font-bold">¥{pkg.price_fen / 100}</span>
              </div>
              <p className="text-sm text-muted-foreground">{pkg.credits} 积分</p>
              <PurchaseButton packageId={id} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 流水记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">积分流水</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <p className="text-sm text-muted-foreground">暂无记录</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {log.description ?? log.action}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={log.amount > 0 ? 'text-green-600' : 'text-red-500'}>
                      {log.amount > 0 ? '+' : ''}{log.amount}
                    </span>
                    <span className="text-muted-foreground">余额 {log.balance}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
