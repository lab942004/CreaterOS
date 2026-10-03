import { config } from '../../config';
import { BrevoProvider } from './brevo.provider';
import { LogProvider } from './log.provider';
import { ResendProvider } from './resend.provider';
import { EmailMessage, EmailProvider } from './types';

export * from './types';
export * from './templates';

/**
 * Small factory so routes never know which vendor is behind `send()`.
 * Swap EMAIL_PROVIDER between `resend` / `brevo` / `log` without touching callers.
 */
const providers: Record<string, EmailProvider> = {
  resend: new ResendProvider(),
  brevo: new BrevoProvider(),
  log: new LogProvider(),
};

const pick = (): EmailProvider => {
  const requested = providers[config.mail.provider];
  if (requested) return requested;
  if (config.isProd) {
    // Never silently fall back to printing emails in production.
    throw new Error(`Unknown EMAIL_PROVIDER "${config.mail.provider}". Use resend, brevo or log.`);
  }
  return providers.log;
};

export interface SendResult {
  id: string;
  provider: string;
}

export const sendEmail = async (message: EmailMessage): Promise<SendResult> => {
  const provider = pick();
  const result = await provider.send(message);
  return { ...result, provider: provider.name };
};

export const emailProviderName = (): string => config.mail.provider;
export const isEmailConfigured = (): boolean => pick().isConfigured();
