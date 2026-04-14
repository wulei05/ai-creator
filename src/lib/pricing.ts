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
  'flux-pro': 10,
  'kling-v2': 50,
  'kling-v2-10s': 90,
  'gpt-4o': 1,
  'deepseek-chat': 1,
  'claude-sonnet-4-6': 2,
} as const

export type ModelId = keyof typeof CREDIT_COSTS
