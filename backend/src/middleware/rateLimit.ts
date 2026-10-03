import { Request, Response, NextFunction } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

/**
 * Client identity for rate limiting — prefers the authenticated user.
 * The IP branch must go through `ipKeyGenerator` so IPv6 callers are bucketed
 * by subnet instead of leaking a bypassable raw address (express-rate-limit v8).
 */
const keyGenerator = (req: Request): string => {
  const user = (req as unknown as { user?: { id?: string } }).user;
  if (user?.id) return `u:${user.id}`;
  return `ip:${ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown')}`;
};

const handler = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    // Route-specific messages are overridden by the route, this is the default.
    message: { success: false, data: null, message: 'Too many requests. Please try again later.', error: { code: 'RATE_LIMITED' } },
  });

/** Broad ceiling applied to the whole authenticated API. */
export const apiLimiter = handler(Number(process.env.RATE_LIMIT_MAX || 600), 60_000);

/** Login / register / OTP endpoints — aggressively throttled. */
export const authLimiter = handler(Number(process.env.AUTH_RATE_LIMIT_MAX || 20), 15 * 60_000);

/** Password reset request + resend OTP — throttled per identity. */
export const sensitiveLimiter = handler(Number(process.env.SENSITIVE_RATE_LIMIT_MAX || 10), 15 * 60_000);

/** AI completion endpoints are expensive; keep them tight. */
export const aiLimiter = handler(Number(process.env.AI_RATE_LIMIT_MAX || 60), 60_000);

export const limit = (max: number, windowMs: number) => handler(max, windowMs);
