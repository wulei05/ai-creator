import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Graceful fallback when Upstash env vars are not configured
const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('your-');

// A no-op rate limiter that always allows requests
const noopLimiter = {
  limit: async (_identifier: string) => ({
    success: true,
    limit: -1,
    remaining: -1, // -1 signals "no limit applied" (Upstash not configured)
    reset: 0,
    pending: Promise.resolve(),
  }),
};

function createRateLimit(limiter: Ratelimit['limiter'], prefix: string) {
  if (!hasUpstashConfig) {
    console.warn(
      `[ratelimit] Upstash env vars not configured, skipping rate limiting for prefix: ${prefix}`
    );
    return noopLimiter as unknown as Ratelimit;
  }

  const redis = Redis.fromEnv();
  return new Ratelimit({
    redis,
    limiter,
    prefix,
  });
}

// 5 image requests per user per minute
export const imageRateLimit = createRateLimit(
  Ratelimit.slidingWindow(5, '1 m'),
  'rl:image'
);

// 2 video requests per user per minute
export const videoRateLimit = createRateLimit(
  Ratelimit.slidingWindow(2, '1 m'),
  'rl:video'
);

// 30 chat messages per user per minute
export const chatRateLimit = createRateLimit(
  Ratelimit.slidingWindow(30, '1 m'),
  'rl:chat'
);
