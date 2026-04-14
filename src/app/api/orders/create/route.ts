import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PACKAGES, PackageId } from '@/lib/pricing'
import { createPayment } from '@/lib/payment'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await req.json() as { package_id: string }
  const packageId = body.package_id as PackageId

  const pkg = PACKAGES[packageId]
  if (!pkg) {
    return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
  }

  // Create order in DB
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      amount_fen: pkg.price_fen,
      credits: pkg.credits,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Order creation error:', orderError)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Build URLs
  const baseUrl = process.env.NEXT_PUBLIC_URL
  if (!baseUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }
  const notifyUrl = `${baseUrl}/api/orders/webhook`
  const returnUrl = `${baseUrl}/credits`

  // Call Xunhupay
  let payUrl: string
  let payId: string
  try {
    const result = await createPayment({
      outTradeNo: order.id,
      totalFee: pkg.price_fen / 100,
      title: pkg.name,
      notifyUrl,
      returnUrl,
    })
    payUrl = result.payUrl
    payId = result.payId
  } catch (err) {
    console.error('Payment creation error:', err)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }

  // Update order with pay_id and pay_url
  await supabase
    .from('orders')
    .update({ pay_id: payId, pay_url: payUrl })
    .eq('id', order.id)

  return NextResponse.json({
    order_id: order.id,
    pay_url: payUrl,
    amount: pkg.price_fen / 100,
    credits: pkg.credits,
  })
}
