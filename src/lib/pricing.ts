export const PACKAGES = {
  starter: {
    name: '体验包',
    price_fen: 900,
    credits: 100,
    popular: false,
  },
  basic: {
    name: '基础包',
    price_fen: 2900,
    credits: 400,
    popular: false,
  },
  standard: {
    name: '标准包',
    price_fen: 9900,
    credits: 1500,
    popular: true,
  },
  pro: {
    name: '专业包',
    price_fen: 29900,
    credits: 5000,
    popular: false,
  },
} as const

export type PackageId = keyof typeof PACKAGES

export const CREDIT_COSTS = {
  // ── Image generation ──────────────────────────────
  'flux-pro':               10,
  'imagen-4':               10,
  'imagen-4-ultra':         15,
  'imagen-4-fast':           6,
  'gemini-2.5-flash-image':  6,
  'gemini-3-pro-image':     12,
  'gemini-3.1-flash-image':  6,
  // ── Video generation ─────────────────────────────
  'kling-v2':               50,
  'kling-v2-10s':           90,
  'veo-3':                  80,
  'veo-3-fast':             50,
  // ── Chat ─────────────────────────────────────────
  'gpt-4o':                  1,
  'deepseek-chat':            1,
  'claude-sonnet-4-6':        2,
  'gemini-2.5-pro':           3,
  'gemini-2.5-flash':         1,
  'gemini-2.0-flash':         1,
  'gemini-2.0-flash-lite':    1,
  'gemini-1.5-pro':           2,
  'gemini-1.5-flash':         1,
  'gemini-3-pro':             4,
  'gemini-3-flash':           1,
  'gemini-3.1-pro':           4,
  'gemini-3.1-flash-lite':    1,
} as const

export type ModelId = keyof typeof CREDIT_COSTS
