import { Response, NextFunction, Request } from 'express';

export type ErrorKind =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL';

const STATUS: Record<ErrorKind, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly kind: ErrorKind;
  readonly status: number;
  readonly details?: unknown;

  constructor(kind: ErrorKind, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = STATUS[kind];
    this.details = details;
  }
}

export const badRequest = (m = 'Bad request', d?: unknown) => new AppError('BAD_REQUEST', m, d);
export const unauthorized = (m = 'Authentication required', d?: unknown) => new AppError('UNAUTHORIZED', m, d);
export const forbidden = (m = 'Access denied', d?: unknown) => new AppError('FORBIDDEN', m, d);
export const notFound = (m = 'Resource not found', d?: unknown) => new AppError('NOT_FOUND', m, d);
export const conflict = (m = 'Resource already exists', d?: unknown) => new AppError('CONFLICT', m, d);
export const rateLimited = (m = 'Too many requests', d?: unknown) => new AppError('RATE_LIMITED', m, d);

/** Standard envelope. `data` mirrors the legacy shapes so existing screens keep working. */
export const ok = (res: Response, data: unknown, message?: string, status = 200) =>
  res.status(status).json({ success: true, data, message: message ?? null });

export const fail = (res: Response, kind: ErrorKind, message: string, details?: unknown) =>
  res.status(STATUS[kind]).json({
    success: false,
    data: null,
    message,
    error: { code: kind, message, details: details ?? null },
  });

/**
 * Coerces an untrusted value into a Prisma enum member.
 *
 * Accepts any casing (`"youtube"` -> `"YOUTUBE"`) because the UI sends
 * upper-case constants but query strings and older clients are looser.
 * Returns `undefined` for anything outside `allowed`, so callers decide
 * whether to fall back to a default or reject the request.
 */
export const asEnum = <T extends string>(value: unknown, allowed: readonly T[]): T | undefined => {
  if (typeof value !== 'string') return undefined;
  const upper = value.toUpperCase();
  return (allowed as readonly string[]).includes(upper) ? (upper as T) : undefined;
};

interface PrismaKnownError {
  code?: string;
  meta?: { target?: unknown; field_name?: string };
}

const isPrismaError = (e: unknown): e is Error & PrismaKnownError =>
  !!e && typeof e === 'object' && typeof (e as { name?: string }).name === 'string' && (e as { name: string }).name.startsWith('Prisma');

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  if (err instanceof AppError) {
    return fail(res, err.kind, err.message, err.details);
  }

  if (isPrismaError(err)) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta!.target.join(', ') : String(err.meta?.target ?? 'field');
      return fail(res, 'CONFLICT', `A record with that ${target} already exists.`);
    }
    if (err.code === 'P2025') return fail(res, 'NOT_FOUND', 'Resource not found.');
    if (err.code === 'P2003') return fail(res, 'BAD_REQUEST', 'Related resource does not exist.');
    if (err.code === 'P2021' || err.code === 'P2022') {
      return fail(res, 'SERVICE_UNAVAILABLE', 'Database schema is out of date. Run `npx prisma migrate deploy`.');
    }
    return fail(res, 'INTERNAL', 'Database error.');
  }

  // Body parser / JSON syntax errors
  const e = err as { type?: string; status?: number; message?: string };
  if (e?.type === 'entity.parse.failed') return fail(res, 'BAD_REQUEST', 'Malformed JSON body.');
  if (typeof e?.status === 'number' && e.status < 500) {
    return fail(res, e.status === 401 ? 'UNAUTHORIZED' : e.status === 403 ? 'FORBIDDEN' : 'BAD_REQUEST', e.message || 'Request failed.');
  }

  // Zod validation thrown by `validateBody`
  const z = err as { name?: string; issues?: { path: (string | number)[]; message: string }[] };
  if (z?.name === 'ZodError' && Array.isArray(z.issues)) {
    const details = z.issues.map((i) => ({ field: i.path.join('.') || '(body)', message: i.message }));
    return fail(res, 'VALIDATION_ERROR', details[0]?.message || 'Validation failed.', details);
  }

  console.error('[unhandled error]', err);
  return fail(res, 'INTERNAL', 'Internal server error.');
};

export const notFoundHandler = (_req: Request, res: Response) =>
  fail(res, 'NOT_FOUND', 'Endpoint not found.');

/** Wraps an async route handler so rejected promises reach the error handler. */
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: T, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
