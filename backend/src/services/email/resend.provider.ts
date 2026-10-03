import { config } from '../../config';
import { EmailMessage, EmailNotConfiguredError, EmailProvider } from './types';

/** Official Resend HTTP API — https://resend.com/docs/api-reference */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend' as const;
  private readonly endpoint = 'https://api.resend.com/emails';

  isConfigured(): boolean {
    return !!config.mail.resendApiKey;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    if (!this.isConfigured()) throw new EmailNotConfiguredError(this.name);

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.mail.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.mail.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html ?? message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { id?: string };
    return { id: json.id ?? 'unknown' };
  }
}
