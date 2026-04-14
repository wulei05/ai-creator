import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhook } from '@/lib/payment'

// Service role client — bypasses RLS, safe for webhook (no user session)
function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  // Parse form-urlencoded body from Xunhupay
  const text = await req.text()
  const params: Record<string, string> = {}
  for (const pair of text.split('&')) {
    const [key, ...valueParts] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(valueParts.join('='))
    }
  }

  // Verify signature
  if (!verifyWebhook(params)) {
    return new NextResponse('invalid signature', { status: 400 })
  }

  // Must be paid status
  if (params.status !== 'OD') {
    return new NextResponse('success')
  }

  const outTradeNo = params.out_trade_no
  const tradeNo = params.trade_no
  const totalFee = parseFloat(params.total_fee)

  if (!outTradeNo) {
    return new NextResponse('missing out_trade_no', { status: 400 })
  }

  const supabase = createServiceClient()

  // Find the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, amount_fen, credits, status')
    .eq('id', outTradeNo)
    .single()

  if (orderError || !order) {
    console.error('Order not found:', outTradeNo, orderError)
    return new NextResponse('order not found', { status: 404 })
  }

  // Idempotency: already paid
  if (order.status === 'paid') {
    return new NextResponse('success')
  }

  // Verify amount
  const expectedFee = order.amount_fen / 100
  if (Math.abs(totalFee - expectedFee) > 0.001) {
    console.error(`Fee mismatch: expected ${expectedFee}, got ${totalFee}`)
    return new NextResponse('fee mismatch', { status: 400 })
  }

  // Add credits via RPC (SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc('add_credits', {
    p_user_id: order.user_id,
    p_amount: order.credits,
    p_order_id: order.id,
  })

  if (rpcError) {
    console.error('add_credits RPC error:', rpcError)
    return new NextResponse('rpc error', { status: 500 })
  }

  // Mark order as paid
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      pay_id: tradeNo,
      paid_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (updateError) {
    console.error('Order update error:', updateError)
    // Credits were already added — log but still return success to avoid double-credit on retry
  }

  return new NextResponse('success')
}
