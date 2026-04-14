import crypto from 'crypto'

const XUNHU_KEY = process.env.XUNHU_KEY!
const XUNHU_APPID = process.env.XUNHU_APPID!

function buildSign(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .filter(k => params[k] !== '')
    .map(k => `${k}=${params[k]}`)
    .join('&') + `&key=${XUNHU_KEY}`
  return crypto.createHash('md5').update(sorted).digest('hex').toUpperCase()
}

// Verify webhook signature (HMAC-MD5)
export function verifyWebhook(params: Record<string, string>): boolean {
  const { sign, ...rest } = params
  const sorted = Object.keys(rest)
    .sort()
    .filter(k => rest[k] !== '')
    .map(k => `${k}=${rest[k]}`)
    .join('&') + `&key=${XUNHU_KEY}`
  const expected = crypto
    .createHash('md5')
    .update(sorted)
    .digest('hex')
    .toUpperCase()
  if (!sign) return false
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(sign, 'utf8')
  )
}

// Create payment via Xunhupay API
export async function createPayment(order: {
  outTradeNo: string   // our order ID
  totalFee: number     // amount in CNY yuan (e.g. 9, 29, 99)
  title: string        // product title
  notifyUrl: string    // webhook callback URL
  returnUrl: string    // redirect after payment
}): Promise<{ payUrl: string; payId: string }> {
  const nonceStr = crypto.randomBytes(16).toString('hex')
  const time = Math.floor(Date.now() / 1000).toString()

  const params: Record<string, string> = {
    appid: XUNHU_APPID,
    out_trade_no: order.outTradeNo,
    total_fee: order.totalFee.toString(),
    title: order.title,
    time,
    notify_url: order.notifyUrl,
    return_url: order.returnUrl,
    nonce_str: nonceStr,
  }

  params.sign = buildSign(params)

  const res = await fetch('https://api.xunhupay.com/payment/do.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(10_000),
  })

  const json = await res.json() as {
    errcode: number
    errmsg: string
    data: {
      pay_url: string
      url_qrcode: string
      trade_no: string
    }
  }

  if (json.errcode !== 0) {
    throw new Error(`Xunhupay error: ${json.errmsg}`)
  }

  return {
    payUrl: json.data.pay_url,
    payId: json.data.trade_no,
  }
}
