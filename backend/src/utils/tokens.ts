import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config';
import { prisma } from './prisma';

export const ACCESS_COOKIE = 'creatoros_at';
export const REFRESH_COOKIE = 'creatoros_rt';

export interface AccessPayload {
  sub: string;
  typ: 'access' | 'admin';
  email: string;
}

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] });

export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AccessPayload;
    if (!decoded?.sub || (decoded.typ !== 'access' && decoded.typ !== 'admin')) return null;
    return decoded;
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Refresh tokens — opaque random values, stored only as a SHA-256 hash */
/* ------------------------------------------------------------------ */

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const refreshExpiryDate = () => new Date(Date.now() + config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);

export const cookieOptions = (path = '/') => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  domain: config.cookie.domain,
  path,
  maxAge: config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
});

/** Issues a new refresh token row + cookie for a user. */
export const issueRefreshToken = async (
  userId: string,
  meta: { userAgent?: string | null; ipAddress?: string | null } = {},
  res: Response
): Promise<string> => {
  const token = crypto.randomBytes(48).toString('hex');
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt: refreshExpiryDate(),
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ipAddress: meta.ipAddress ?? null,
    },
  });
  res.cookie(REFRESH_COOKIE, token, cookieOptions('/api/auth'));
  return token;
};

/** Validates + rotates the refresh token presented in the cookie. Returns the userId or null. */
export const rotateRefreshToken = async (token: string, res: Response): Promise<string | null> => {
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
    res.clearCookie(REFRESH_COOKIE, cookieOptions('/api/auth'));
    return null;
  }

  // Rotate: revoke the presented token and issue a successor.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  await issueRefreshToken(
    record.userId,
    { userAgent: record.userAgent, ipAddress: record.ipAddress },
    res
  );
  return record.userId;
};

export const revokeRefreshToken = async (token: string | undefined): Promise<void> => {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
};

export const setAccessCookie = (res: Response, token: string): void => {
  res.cookie(ACCESS_COOKIE, token, {
    ...cookieOptions('/'),
    maxAge: 15 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(ACCESS_COOKIE, { ...cookieOptions('/'), maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions('/api/auth'), maxAge: undefined });
};

/* ------------------------------- OTP ------------------------------ */

/** Generates a cryptographically-random numeric OTP of the configured length. */
export const generateOtp = (length = config.otp.length): string => {
  const max = 10 ** length;
  // Rejection-free modulo over a full-range random int; bias is negligible for 6 digits.
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, '0');
};

export const hashOtp = (otp: string, salt: string): string =>
  crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');

export const timingSafeEqualStr = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};
