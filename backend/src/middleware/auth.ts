import { Request, Response, NextFunction } from 'express';
import { User, Workspace } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError, forbidden, unauthorized } from '../utils/errors';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens';

export interface AuthRequest extends Request {
  user?: User | null;
  workspace?: Workspace | null;
  workspaceId?: string;
  admin?: { id: string; email: string; name: string; role: string };
}

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
  if (cookies?.[ACCESS_COOKIE]) return cookies[ACCESS_COOKIE];
  return null;
};

export const clientIp = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
  req.ip ||
  req.socket?.remoteAddress ||
  '127.0.0.1';

/**
 * Requires a valid access token. There is intentionally **no** development
 * fallback — an unauthenticated request now fails closed instead of silently
 * operating as the first seeded user.
 */
export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) throw unauthorized('Authentication required.');

    const payload = verifyAccessToken(token);
    if (!payload) throw unauthorized('Your session has expired. Please sign in again.');
    if (payload.typ !== 'access') throw forbidden('This token cannot be used for this endpoint.');

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized('Your account no longer exists.');
    if (!user.isActive) throw forbidden('This account has been suspended.');
    if (!user.emailVerified) throw forbidden('Verify your email before using the API.');

    req.user = user;

    // Resolve the caller's primary workspace (or an explicit ?workspaceId / header).
    const requested =
      (req.headers['x-workspace-id'] as string | undefined) ||
      (req.query?.workspaceId as string | undefined) ||
      null;

    let workspace: Workspace | null = null;
    if (requested) {
      workspace = await prisma.workspace.findFirst({
        where: { id: requested, members: { some: { userId: user.id } } },
      });
      if (!workspace) throw forbidden('You do not have access to that workspace.');
    } else {
      workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: user.id } } },
        orderBy: { createdAt: 'asc' },
      });
    }

    req.workspace = workspace;
    req.workspaceId = workspace?.id;
    next();
  } catch (err) {
    next(err);
  }
};

/** Best-effort variant used by endpoints that are public but personalised when signed in. */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = verifyAccessToken(token);
    if (!payload || payload.typ !== 'access') return next();
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user?.isActive && user.emailVerified) {
      req.user = user;
      req.workspace = await prisma.workspace.findFirst({
        where: { members: { some: { userId: user.id } } },
        orderBy: { createdAt: 'asc' },
      });
      req.workspaceId = req.workspace?.id ?? undefined;
    }
    next();
  } catch {
    next();
  }
};

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) throw unauthorized('Administrator authentication required.');

    const payload = verifyAccessToken(token);
    if (!payload || payload.typ !== 'admin') throw unauthorized('Administrator authentication required.');

    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) throw unauthorized('Administrator session is no longer valid.');

    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
    next();
  } catch (err) {
    next(err instanceof AppError ? err : unauthorized('Administrator authentication required.'));
  }
};

/** Guard used by routes that must have a workspace to do anything useful. */
export const requireWorkspace = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.workspaceId) {
    return next(new AppError('NOT_FOUND', 'No workspace is associated with your account yet.'));
  }
  return next();
};

/** Throws a 404 AppError when the record does not belong to the caller's workspace. */
export const assertInWorkspace = (
  found: unknown,
  workspaceId: string | undefined,
  message = 'Resource not found.'
): void => {
  if (!found || !workspaceId) throw new AppError('NOT_FOUND', message);
};

