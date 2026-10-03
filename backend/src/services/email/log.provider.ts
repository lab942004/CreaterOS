import { EmailMessage, EmailProvider } from './types';

/**
 * Dev fallback: prints the email to the server console instead of sending it.
 * Keeps the OTP flow fully testable without any third-party credentials.
 */
export class LogProvider implements EmailProvider {
  readonly name = 'log' as const;

  isConfigured(): boolean {
    return true;
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = `log-${Date.now()}`;
    // eslint-disable-next-line no-console
    console.log(
      [
        '',
        '─────────────── [EMAIL:dev/log] ───────────────',
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        message.text,
        '───────────────────────────────────────────────',
        '',
      ].join('\n')
    );
    return { id };
  }
}
