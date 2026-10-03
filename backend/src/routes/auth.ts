import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { asyncHandler, ok, unauthorized } from '../utils/errors';
import { validateBody } from '../middleware/validate';
import { authLimiter, sensitiveLimiter } from '../middleware/rateLimit';
import { authenticate, AuthRequest, clientIp } from '../middleware/auth';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  issueRefreshToken,
  rotateRefreshToken,
  setAccessCookie,
  signAccessToken,
} from '../utils/tokens';
import {
  PUBLIC_USER_SELECT,
  changePassword,
  login,
  logout,
  logoutEverywhere,
  registerUser,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  verifyOtp,
} from '../services/auth.service';

const router = Router();

const meta = (req: Request) => ({
  userAgent: (req.headers['user-agent'] as string) || null,
  ipAddress: clientIp(req),
});

const emailSchema = z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.')
  .regex(/[a-zA-Z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  email: emailSchema,
  password: passwordSchema,
});

const verifySchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code we emailed you.'),
});

const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Password is required.') });

const forgotSchema = z.object({ email: emailSchema });

const resetSchema = z.object({ token: z.string().min(10), password: passwordSchema });

const onboardingSchema = z.object({
  step: z.number().int().min(1).max(12).optional(),
  completed: z.boolean().optional(),
  profileData: z.record(z.string(), z.unknown()).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: passwordSchema,
});

/* ------------------------------ public ------------------------------ */

router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, email, expiresAt } = await registerUser(req.body);
    ok(
      res,
      {
        user,
        email,
        requiresVerification: true,
        otpTtlMinutes: config.otp.ttlMinutes,
        expiresAt: expiresAt.toISOString(),
      },
      'Verification code sent.',
      201
    );
  })
);

router.post(
  '/verify-otp',
  authLimiter,
  validateBody(verifySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body;
    const { user, workspace } = await verifyOtp(email, code, meta(req));

    const token = signAccessToken({ sub: user.id, typ: 'access', email: user.email });
    setAccessCookie(res, token);
    const refreshToken = await issueRefreshToken(user.id, meta(req), res);

    ok(res, { token, refreshToken, user, workspace }, 'Email verified.');
  })
);

router.post(
  '/resend-otp',
  sensitiveLimiter,
  validateBody(z.object({ email: emailSchema })),
  asyncHandler(async (req: Request, res: Response) => {
    const { expiresAt } = await resendOtp(req.body.email);
    ok(res, { expiresAt: expiresAt.toISOString(), ttlMinutes: config.otp.ttlMinutes }, 'Verification code sent.');
  })
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { user, workspace } = await login(req.body.email, req.body.password, meta(req));

    const token = signAccessToken({ sub: user.id, typ: 'access', email: user.email });
    setAccessCookie(res, token);
    const refreshToken = await issueRefreshToken(user.id, meta(req), res);

    ok(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isOnboarded: user.isOnboarded,
        onboardingStep: user.onboardingStep,
        emailVerified: user.emailVerified,
      },
      workspace,
    });
  })
);

/** Exchanges a refresh cookie for a fresh access token — no password required. */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const token = (req as unknown as { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE];
    if (!token) throw unauthorized('No active session.');

    const userId = await rotateRefreshToken(token, res);
    if (!userId) throw unauthorized('Your session has expired. Please sign in again.');

    const user = await prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT });
    if (!user) throw unauthorized('Your account no longer exists.');

    const accessToken = signAccessToken({ sub: user.id, typ: 'access', email: user.email });
    setAccessCookie(res, accessToken);
    ok(res, { token: accessToken, user });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies;
    await logout(cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);
    ok(res, { message: 'Signed out.' });
  })
);

router.post(
  '/forgot-password',
  sensitiveLimiter,
  validateBody(forgotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await requestPasswordReset(req.body.email);
    // Uniform response regardless of whether the account exists.
    ok(res, { message: 'If that address is registered, a reset link is on its way.' });
  })
);

router.post(
  '/reset-password',
  sensitiveLimiter,
  validateBody(resetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await resetPassword(req.body.token, req.body.password);
    clearAuthCookies(res);
    ok(res, { message: 'Password updated. You can now sign in.' });
  })
);

/* ---------------------------- authenticated ---------------------------- */

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const [profile, workspaces, memberships, usage] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: user.id } }),
      prisma.workspace.findMany({
        where: { members: { some: { userId: user.id } } },
        select: { id: true, name: true, slug: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.workspaceMember.findMany({
        where: { userId: user.id },
        select: { role: true, workspaceId: true },
      }),
      aiUsageSummary(user.id),
    ]);

    ok(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isOnboarded: user.isOnboarded,
        onboardingStep: user.onboardingStep,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      profile,
      workspace: req.workspace,
      workspaces,
      role: memberships.find((m) => m.workspaceId === req.workspaceId)?.role ?? null,
      usage,
    });
  })
);

const PROFILE_FIELDS = new Set([
  'handle',
  'niche',
  'bio',
  'creatorType',
  'audience',
  'audienceSize',
  'voice',
  'goals',
  'platforms',
  'contentTypes',
  'tones',
  'importSelection',
  'aiSettings',
]);

router.post(
  '/onboarding',
  authenticate,
  validateBody(onboardingSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { step, completed, profileData } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(step !== undefined ? { onboardingStep: step } : {}),
        ...(completed !== undefined ? { isOnboarded: completed } : {}),
      },
      select: PUBLIC_USER_SELECT,
    });

    if (profileData && typeof profileData === 'object') {
      const allowed: Record<string, unknown> = {};
      for (const key of Object.keys(profileData)) {
        if (PROFILE_FIELDS.has(key)) allowed[key] = profileData[key];
      }

      if (Object.keys(allowed).length) {
        await prisma.profile.upsert({
          where: { userId },
          create: { userId, ...(allowed as Record<string, never>) },
          update: allowed as Record<string, never>,
        });
      }
    }

    ok(res, { success: true, user }, 'Onboarding progress saved.');
  })
);

router.get(
  '/sessions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const sessions = await prisma.securitySession.findMany({
      where: { userId: req.user!.id },
      orderBy: { lastActive: 'desc' },
    });
    ok(res, { sessions });
  })
);

router.post(
  '/password',
  authenticate,
  authLimiter,
  validateBody(changePasswordSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    clearAuthCookies(res);
    ok(res, { message: 'Password updated. Please sign in again.' });
  })
);

router.post(
  '/logout-all',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await logoutEverywhere(req.user!.id);
    clearAuthCookies(res);
    ok(res, { message: 'Signed out of every device.' });
  })
);

/** Aggregates this month's AI spend for the sidebar usage widget. */
export async function aiUsageSummary(userId: string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const rows = await prisma.aIUsage.aggregate({
    where: { userId, createdAt: { gte: monthStart } },
    _sum: { tokenUsage: true },
    _count: true,
  });

  const tokensUsed = rows._sum.tokenUsage ?? 0;
  const tokenLimit = config.ai.monthlyTokenBudget;
  return {
    planName: 'Creator Pro',
    tokensUsed,
    tokenLimit,
    tokenPercent: Math.min(100, Math.round((tokensUsed / Math.max(1, tokenLimit)) * 100)),
    requests: rows._count,
    monthStart: monthStart.toISOString(),
  };
}

export default router;

