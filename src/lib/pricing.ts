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
  'grok-image':             10,
  'flux-schnell':            3,
  'flux-dev':                8,
  'flux-pro':               10,
  'imagen-4':               10,
  'imagen-4-ultra':         15,
  'imagen-4-fast':           6,
  'gemini-2.5-flash-image':  6,
  'gemini-3-pro-image':     12,
  'gemini-3.1-flash-image':  6,
  // ── Video generation ─────────────────────────────
  'grok-video':             40,
  'seedance-2':             60,
  'seedance-2-fast':        30,
  'wan-2.2':                40,
  'kling-v1-6':             25,
  'kling-v1-6-10s':         45,
  'kling-v2':               50,
  'kling-v2-10s':           90,
  'kling-v2-5':             60,
  'kling-v2-5-10s':        110,
  'kling-v2-6':             70,
  'kling-v2-6-10s':        130,
  'kling-o1':               80,
  'veo-2':                  30,
  'veo-3':                  80,
  'veo-3-fast':             50,
  'veo-3.1':               100,
  'veo-3.1-fast':           60,
  'veo-3.1-lite':           35,
  // ── Chat ─────────────────────────────────────────
  'gpt-4o':                  1,
  'grok-4':                  4,
  'grok-3':                  3,
  'grok-3-fast':             2,
  'grok-3-mini':             1,
  'grok-3-mini-fast':        1,
  'deepseek-chat':            1,
  'deepseek-reasoner':        2,
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
  // ── Qwen (通义千问) ──────────────────────────────────
  'qwen-max':                  2,
  'qwen-plus':                 1,
  'qwen-turbo':                1,
  'qwq-plus':                  2,
  // ── Zhipu GLM (智谱) ────────────────────────────────
  'glm-4-plus':                2,
  'glm-4-flash':               1,
  'glm-z1-plus':               2,
  // ── Kimi (月之暗面) ──────────────────────────────────
  'kimi-latest':               1,
  'kimi-thinking-preview':     2,
} as const

export type ModelId = keyof typeof CREDIT_COSTS
