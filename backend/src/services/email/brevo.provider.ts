import { config } from '../../config';
import { EmailMessage, EmailNotConfiguredError, EmailProvider } from './types';

/** Brevo (formerly Sendinblue) transactional email HTTP API. */
export class BrevoProvider implements EmailProvider {
  readonly name = 'brevo' as const;
  private readonly endpoint = 'https://api.brevo.com/v3/smtp/email';

  isConfigured(): boolean {
    return !!config.mail.brevoApiKey;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    if (!this.isConfigured()) throw new EmailNotConfiguredError(this.name);

    // Brevo expects the sender as `Name <email>` or a verified sender id.
    const fromMatch = config.mail.from.match(/^\s*(?:"?(.*?)"?\s*)?<([^>]+)>\s*$/);
    const sender = fromMatch
      ? { name: fromMatch[1] || config.mail.fromName, email: fromMatch[2] }
      : { name: config.mail.fromName, email: config.mail.from };

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'api-key': config.mail.brevoApiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html ?? message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Brevo API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { message?: string };
    return { id: json.message ?? 'unknown' };
  }
}
