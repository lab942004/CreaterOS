import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { conflict, forbidden, notFound, rateLimited, unauthorized, AppError } from '../utils/errors';
import { generateOtp, hashOtp, revokeAllRefreshTokens, revokeRefreshToken } from '../utils/tokens';
import { passwordChangedEmail, passwordResetEmail, otpEmail, sendEmail, welcomeEmail } from './email';

const BCRYPT_ROUNDS = 12;

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  isOnboarded: true,
  onboardingStep: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';

const uniqueSlug = async (base: string): Promise<string> => {
  const root = slugify(base);
  for (let i = 0; i < 25; i++) {
    const candidate = i === 0 ? root : `${root}-${crypto.randomBytes(2).toString('hex')}`;
    const existing = await prisma.workspace.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
};

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, BCRYPT_ROUNDS);
export const verifyPassword = (plain: string, hashed: string): Promise<boolean> => bcrypt.compare(plain, hashed);

/* ------------------------------------------------------------------ */
/* Workspace bootstrap                                                  */
/* ------------------------------------------------------------------ */

export const ensureWorkspace = async (user: Pick<User, 'id' | 'name' | 'email'>) => {
  const existing = await prisma.workspace.findFirst({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;

  const displayName = user.name || user.email.split('@')[0];
  return prisma.workspace.create({
    data: {
      name: `${displayName}'s Workspace`,
      slug: await uniqueSlug(`${displayName}s-workspace`),
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
      subscription: { create: {} },
      creatorBrain: { create: { pillars: [] } },
    },
  });
};

export const primaryWorkspaceOf = (userId: string) =>
  prisma.workspace.findFirst({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'asc' },
  });


/* ------------------------------------------------------------------ */
/* OTP issuance (shared by register + resend)                           */
/* ------------------------------------------------------------------ */

export const issueOtp = async (user: User): Promise<{ expiresAt: Date }> => {
  const now = Date.now();

  // Throttle resends: at most N codes per hour per email.
  const recentCount = await prisma.emailVerification.count({
    where: { email: user.email, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
  });
  if (recentCount >= config.otp.maxResendsPerHour) {
    throw rateLimited('Too many verification codes requested. Please try again in an hour.');
  }

  const otp = generateOtp();
  // Per-code salt keeps identical OTPs from producing identical hashes.
  const salt = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(now + config.otp.ttlMinutes * 60 * 1000);

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      email: user.email,
      otpHash: `${salt}:${hashOtp(otp, salt)}`,
      expiresAt,
    },
  });

  await sendEmail({ to: user.email, ...otpEmail(user.name, otp, config.otp.ttlMinutes) });
  return { expiresAt };
};

/* ------------------------------------------------------------------ */
/* Register                                                             */
/* ------------------------------------------------------------------ */

export const registerUser = async (input: { name: string; email: string; password: string }) => {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('An account with this email already exists. Try signing in instead.');

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      password: await hashPassword(input.password),
      emailVerified: false,
      isOnboarded: false,
      onboardingStep: 1,
      profile: { create: {} },
    },
    select: PUBLIC_USER_SELECT,
  });

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  await ensureWorkspace(full);
  const { expiresAt } = await issueOtp(full);

  return { user, email, expiresAt };
};

/* ------------------------------------------------------------------ */
/* Verify OTP                                                           */
/* ------------------------------------------------------------------ */

export const verifyOtp = async (
  rawEmail: string,
  otp: string,
  meta: { userAgent?: string | null; ipAddress?: string | null }
) => {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized('That verification code is invalid or has expired.');

  if (user.emailVerified) {
    const workspace = await ensureWorkspace(user);
    return { user, workspace, verified: true as const };
  }

  const record = await prisma.emailVerification.findFirst({
    where: { email, userId: user.id, verifiedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw unauthorized('That verification code is invalid or has expired.');
  if (record.expiresAt.getTime() < Date.now()) {
    throw unauthorized('That verification code has expired. Request a new one.');
  }
  if (record.attempts >= config.otp.maxAttempts) {
    throw rateLimited('Too many incorrect attempts. Request a new code to continue.');
  }

  const [salt, expected] = record.otpHash.split(':');
  if (!expected || hashOtp(otp.trim(), salt) !== expected) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = Math.max(0, config.otp.maxAttempts - (record.attempts + 1));
    throw unauthorized(
      remaining > 0
        ? `That verification code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Request a new code to continue.'
    );
  }

  const fullUser = await prisma.$transaction(async (tx) => {
    await tx.emailVerification.update({ where: { id: record.id }, data: { verifiedAt: new Date() } });
    return tx.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
  });

  const workspace = await ensureWorkspace(fullUser);
  await prisma.auditLog.create({
    data: { userId: fullUser.id, action: 'auth.email_verified', ipAddress: meta.ipAddress ?? null },
  });

  sendEmail({ to: fullUser.email, ...welcomeEmail(fullUser.name, `${config.mail.appUrl}/dashboard`) }).catch(
    () => undefined
  );

  return { user: fullUser, workspace, verified: true as const };
};

export const resendOtp = async (rawEmail: string) => {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw notFound('No account found for that email address.');
  if (user.emailVerified) throw conflict('This email address is already verified. Try signing in.');

  const { expiresAt } = await issueOtp(user);
  return { expiresAt };
};

/* ------------------------------------------------------------------ */
/* Login                                                                */
/* ------------------------------------------------------------------ */

export interface RequestMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const login = async (rawEmail: string, password: string, meta: RequestMeta) => {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error for unknown email and bad password — no account enumeration.
  const invalid = unauthorized('Incorrect email or password.');
  if (!user) throw invalid;

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw invalid;

  if (!user.isActive) throw forbidden('This account has been suspended. Contact support.');

  if (!user.emailVerified) {
    throw new AppError('FORBIDDEN', 'Verify your email before signing in.', {
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
      requiresVerification: true,
    });
  }

  const workspace = await ensureWorkspace(user);
  await recordLogin(user, meta);
  return { user, workspace };
};

export const recordLogin = async (user: User, meta: RequestMeta) => {
  const session = await prisma.securitySession.create({
    data: {
      userId: user.id,
      device: (meta.userAgent || 'Unknown device').slice(0, 255),
      ipAddress: meta.ipAddress || '127.0.0.1',
    },
  });

  // Keep only the 10 most recent sessions per user.
  const stale = await prisma.securitySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    skip: 10,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.securitySession.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'auth.login', ipAddress: meta.ipAddress ?? null },
  });
  return session;
};

/* ------------------------------------------------------------------ */
/* Logout                                                               */
/* ------------------------------------------------------------------ */

export const logout = async (refreshToken: string | undefined) => {
  await revokeRefreshToken(refreshToken);
  return { message: 'Signed out.' };
};

export const logoutEverywhere = async (userId: string) => {
  await revokeAllRefreshTokens(userId);
  await prisma.securitySession.deleteMany({ where: { userId } });
  await prisma.auditLog.create({ data: { userId, action: 'auth.logout_all' } });
};

/* ------------------------------------------------------------------ */
/* Password reset                                                       */
/* ------------------------------------------------------------------ */

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const requestPasswordReset = async (rawEmail: string) => {
  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always report success so the endpoint cannot be used to probe for accounts.
  if (!user || !user.emailVerified) return { sent: false as const };

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + config.passwordReset.ttlMinutes * 60 * 1000),
    },
  });

  const link = `${config.mail.appUrl}/reset-password?token=${token}`;
  await sendEmail({ to: user.email, ...passwordResetEmail(user.name, link, config.passwordReset.ttlMinutes) });
  return { sent: true as const };
};

export const resetPassword = async (token: string, password: string) => {
  if (!token) throw new AppError('BAD_REQUEST', 'A reset token is required.');

  const record = await prisma.passwordReset.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw unauthorized('This reset link is invalid or has expired. Request a new one.');
  }

  const hashed = await hashPassword(password);
  await prisma.$transaction([
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    }),
    // Changing a password invalidates every existing refresh token.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.securitySession.deleteMany({ where: { userId: record.userId } }),
    prisma.auditLog.create({ data: { userId: record.userId, action: 'auth.password_reset' } }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
  sendEmail({ to: user.email, ...passwordChangedEmail(user.name) }).catch(() => undefined);
  return { ok: true as const };
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('Account not found.');

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) throw unauthorized('Your current password is incorrect.');

  const hashed = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashed, passwordChangedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId, action: 'auth.password_changed' } }),
  ]);

  sendEmail({ to: user.email, ...passwordChangedEmail(user.name) }).catch(() => undefined);
  return { ok: true as const };
};

