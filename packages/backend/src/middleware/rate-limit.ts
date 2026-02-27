import { MiddlewareHandler } from 'hono';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
// In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Rate limiting configuration
 */
export interface RateLimitOptions {
  /** Window of time in milliseconds */
  windowMs: number;
  /** Maximum number of requests per window */
  maxRequests: number;
  /** Custom key generator function */
  keyGenerator?: (c: any) => string;
  /** Skip successful requests (don't count them) */
  skipSuccessfulRequests?: boolean;
}

/**
 * Create a rate limiting middleware
 */
export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const { windowMs, maxRequests, keyGenerator, skipSuccessfulRequests } = options;

  return async (c, next) => {
    // Generate key for this request
    const key = keyGenerator
      ? keyGenerator(c)
      : getDefaultKey(c);

    // Get or create entry
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetAfter = Math.ceil((entry.resetTime - now) / 1000);
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
      c.header('Retry-After', resetAfter.toString());

      return c.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetAfter} seconds.`,
        },
        429
      );
    }

    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    await next();

    // Skip counting successful requests if configured
    if (skipSuccessfulRequests && c.res.status < 400) {
      entry.count--;
    }
  };
}

/**
 * Get default key from request
 * Uses CF-Connecting-IP, X-Forwarded-For, or fallback
 */
function getDefaultKey(c: any): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

/**
 * Pre-configured rate limiters for common use cases
 */

// API rate limiter: 100 requests per 15 minutes
export const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

// Strict rate limiter: 10 requests per minute
export const strictLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
});

// Subscription rate limiter: 5 requests per hour
export const subscriptionLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
});

// Push notification rate limiter: 60 per minute
export const pushLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});
