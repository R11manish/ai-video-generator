import { redis } from "./redis-config";

interface RateLimitOptions {
  key: string;
  identifier: string;
  maxRequests: number;
  windowInSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
}


export async function checkRateLimit({
  key,
  identifier,
  maxRequests = 5,
  windowInSeconds = 60,
}: RateLimitOptions): Promise<RateLimitResult> {
  try {
    const rateLimitKey = `ratelimit:${key}:${identifier}`;

    const currentRequests = (await redis.get<number>(rateLimitKey)) || 0;

    const success = currentRequests < maxRequests;
    const remaining = Math.max(0, maxRequests - currentRequests);

    const ttl = await redis.ttl(rateLimitKey);
    const resetIn = ttl > 0 ? ttl : windowInSeconds;
    if (success) {
      if (currentRequests === 0) {
        await redis.set(rateLimitKey, 1, { ex: windowInSeconds });
      } else {
        await redis.incr(rateLimitKey);
      }
    }

    return {
      success,
      remaining,
      limit: maxRequests,
      resetIn,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return {
      success: true,
      remaining: 1,
      limit: maxRequests,
      resetIn: windowInSeconds,
    };
  }
}
