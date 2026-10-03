import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

/**
 * Fail fast on the values that make the app insecure if left at their default.
 * Anything that has no safe production default must be provided explicitly.
 */
const requireInProd = (key: string, fallback: string): string => {
  const value = process.env[key] || fallback;
  if (isProd && (!value || value === fallback)) {
    throw new Error(`[config] ${key} must be set to a non-default value when NODE_ENV=production.`);
  }
  return value;
};

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT || 5000),
  // The frontend (and admin) origin that is allowed to send credentialed requests.
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  jwt: {
    // Signs short-lived access tokens (cookie `creatoros_at`).
    secret: requireInProd('JWT_SECRET', 'creatoros-super-secret-jwt-key-2026'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    // Signs opaque refresh tokens (cookie `creatoros_rt`), rotated on every use.
    refreshSecret: requireInProd('REFRESH_TOKEN_SECRET', 'creatoros-refresh-secret-change-me-2026'),
    refreshExpiresInDays: Number(process.env.REFRESH_TOKEN_DAYS || 30),
  },

  cookie: {
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : isProd,
    sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || (isProd ? 'none' : 'lax'),
    domain: process.env.COOKIE_DOMAIN || undefined,
  },

  otp: {
    length: Number(process.env.OTP_LENGTH || 6),
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 15),
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    maxResendsPerHour: Number(process.env.OTP_MAX_RESENDS_PER_HOUR || 5),
  },

  passwordReset: {
    ttlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@creatoros.ai',
    name: process.env.ADMIN_NAME || 'CreatorOS Super Admin',
    password: process.env.ADMIN_PASSWORD || '',
  },

  mail: {
    // 'resend' | 'brevo' | 'log'  ('log' prints to console — dev fallback)
    provider: (process.env.EMAIL_PROVIDER || (isProd ? 'resend' : 'log')).toLowerCase(),
    from: process.env.EMAIL_FROM || 'CreatorOS <onboarding@resend.dev>',
    fromName: process.env.EMAIL_FROM_NAME || 'CreatorOS',
    resendApiKey: process.env.RESEND_API_KEY || '',
    brevoApiKey: process.env.BREVO_API_KEY || '',
    appUrl: process.env.APP_URL || 'http://localhost:5173',
  },

  ai: {
    // 'openai' | 'huggingface' | 'anthropic' | 'mock'  ('auto' picks the first
    // provider that has credentials, falling back to the mock provider)
    provider: (process.env.AI_PROVIDER || 'auto').toLowerCase(),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    // Hugging Face Inference Providers expose an OpenAI-compatible endpoint, so
    // the same HTTP client serves both. Get a token at https://huggingface.co/settings/tokens
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '',
    huggingfaceBaseUrl: process.env.HUGGINGFACE_BASE_URL || 'https://router.huggingface.co/v1',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
    // Overrides the base URL for any provider (useful for local Ollama / vLLM).
    baseUrl: process.env.AI_BASE_URL || '',
    // Ask for JSON when the model supports it; falls back to prose + parsing.
    jsonMode: process.env.AI_JSON_MODE !== 'false',
    temperature: Number(process.env.AI_TEMPERATURE || 0.7),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 1200),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 60000),
    monthlyTokenBudget: Number(process.env.AI_MONTHLY_TOKEN_BUDGET || 500000),
  },

  storage: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 100),
  },

  social: {
    youtube: { clientId: process.env.YOUTUBE_CLIENT_ID || '', clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '' },
    instagram: { clientId: process.env.INSTAGRAM_CLIENT_ID || '', clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '' },
    tiktok: { clientKey: process.env.TIKTOK_CLIENT_KEY || '', clientSecret: process.env.TIKTOK_CLIENT_SECRET || '' },
    linkedin: { clientId: process.env.LINKEDIN_CLIENT_ID || '', clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '' },
    twitter: { clientId: process.env.TWITTER_CLIENT_ID || '', clientSecret: process.env.TWITTER_CLIENT_SECRET || '' },
  },
};

export type AppConfig = typeof config;

