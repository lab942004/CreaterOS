export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body — always sent so the mail is deliverable without HTML. */
  text: string;
  html?: string;
}

export interface EmailProvider {
  readonly name: 'resend' | 'brevo' | 'log';
  /** True when the provider has credentials configured. */
  isConfigured(): boolean;
  send(message: EmailMessage): Promise<{ id: string }>;
}

export class EmailNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Email provider "${provider}" is not configured. Set its API key in the backend environment.`);
    this.name = 'EmailNotConfiguredError';
  }
}
