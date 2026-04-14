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

  // 1. Verify signature — return "success" on failure (400 would cause Xunhupay to keep retrying)
  if (!await verifyWebhook(params)) {
    return new NextResponse('success')
  }

  // 2. Must be paid status
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

  // 3. Find the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, amount_fen, credits, status')
    .eq('id', outTradeNo)
    .single()

  if (orderError || !order) {
    console.error('Order not found:', outTradeNo, orderError)
    return new NextResponse('order not found', { status: 404 })
  }

  // 4. PRIMARY IDEMPOTENCY CHECK: query credit_logs for a purchase entry with this order_id
  //    credit_logs is the true idempotency source because add_credits is NOT idempotent
  //    (no unique constraint on order_id in credit_logs table)
  const { data: existingLog, error: logQueryError } = await supabase
    .from('credit_logs')
    .select('id')
    .eq('order_id', order.id)
    .eq('action', 'purchase')
    .maybeSingle()

  if (logQueryError) {
    console.error('credit_logs query error:', logQueryError)
    return new NextResponse('database error', { status: 500 })
  }

  if (existingLog) {
    // Credits already granted — idempotent success
    return new NextResponse('success')
  }

  // 5. SECONDARY: order already marked 'paid' but no credit_log entry
  //    → partial failure from a previous attempt → fall through to retry add_credits

  // 6. Verify amount
  const expectedFee = order.amount_fen / 100
  if (Math.abs(totalFee - expectedFee) > 0.001) {
    console.error(`Fee mismatch: expected ${expectedFee}, got ${totalFee}`)
    return new NextResponse('fee mismatch', { status: 400 })
  }

  // 7. Update order to 'paid' (filter on status='pending' — safe to call even if already paid
  //    since we already verified via credit_logs above)
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      pay_id: tradeNo,
      paid_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('status', 'pending')

  if (updateError) {
    console.error('Order update error:', updateError)
    return new NextResponse('update error', { status: 500 })
  }

  // 8. Call add_credits RPC (SECURITY DEFINER)
  const { error: rpcError } = await supabase.rpc('add_credits', {
    p_user_id: order.user_id,
    p_amount: order.credits,
    p_order_id: order.id,
  })

  // 9. If add_credits FAILS → return 500 so Xunhupay retries
  //    On retry: credit_logs still empty → will attempt add_credits again
  if (rpcError) {
    console.error('add_credits RPC failed for order:', order.id, rpcError)
    return new NextResponse('credits error', { status: 500 })
  }

  // 10. All done
  return new NextResponse('success')
}
