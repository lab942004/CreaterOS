export interface MailTemplate {
  subject: string;
  text: string;
  html: string;
}

const shell = (heading: string, bodyHtml: string, footer = 'CreatorOS · automating the creator economy') => `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#F6F7FB;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#F6F7FB;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0"
               style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px 32px;">
            <div style="font-size:18px;font-weight:700;color:#4F46E5;letter-spacing:-0.02em;">CreatorOS</div>
            <h1 style="margin:18px 0 0 0;font-size:20px;line-height:1.35;color:#111827;">${heading}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 4px 32px;">
            <div style="font-size:15px;line-height:1.65;color:#4B5563;">${bodyHtml}</div>
          </td></tr>
          <tr><td style="padding:24px 32px 28px 32px;">
            <div style="font-size:12px;line-height:1.6;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:16px;">${footer}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

const codeBlock = (code: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px 0;">
  <tr>
    <td align="center" style="background:#EEF2FF;border:1px dashed #A5B4FC;border-radius:12px;padding:16px 26px;
        font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:12px;
        color:#4338CA;">${code}</td>
  </tr>
</table>`;

export const otpEmail = (name: string, code: string, ttlMinutes: number): MailTemplate => ({
  subject: `${code} is your CreatorOS verification code`,
  text: `Hi ${name},

Your CreatorOS verification code is:

  ${code}

It expires in ${ttlMinutes} minutes. If you did not request this code, you can safely ignore this email.

— The CreatorOS team`,
  html: shell(
    'Verify your email address',
    `<p style="margin:0 0 12px 0;">Hi ${name},</p>
     <p style="margin:0 0 4px 0;">Use the code below to finish creating your CreatorOS account:</p>
     ${codeBlock(code)}
     <p style="margin:14px 0 0 0;font-size:13px;color:#6B7280;">This code expires in <strong>${ttlMinutes} minutes</strong>. If you didn't request it, you can safely ignore this email.</p>`
  ),
});

export const passwordResetEmail = (name: string, link: string, ttlMinutes: number): MailTemplate => ({
  subject: 'Reset your CreatorOS password',
  text: `Hi ${name},

Someone requested a password reset for your CreatorOS account.

Open the link below to choose a new password (valid for ${ttlMinutes} minutes):

${link}

If you did not request this, ignore this email — your password will not change.

— The CreatorOS team`,
  html: shell(
    'Reset your password',
    `<p style="margin:0 0 12px 0;">Hi ${name},</p>
     <p style="margin:0 0 20px 0;">Someone requested a password reset for your CreatorOS account. Choose a new password using the link below — it is valid for <strong>${ttlMinutes} minutes</strong>.</p>
     <p style="margin:0 0 24px 0;">
       <a href="${link}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;
          padding:12px 22px;border-radius:10px;font-size:15px;font-weight:600;">Choose a new password</a>
     </p>
     <p style="margin:0;font-size:13px;color:#6B7280;">If you didn't request this, you can safely ignore this email — your password will not change.</p>`
  ),
});

export const passwordChangedEmail = (name: string): MailTemplate => ({
  subject: 'Your CreatorOS password was changed',
  text: `Hi ${name},

Your CreatorOS password was just changed. All other sessions have been signed out.

If this was not you, reset your password immediately.

— The CreatorOS team`,
  html: shell(
    'Your password was changed',
    `<p style="margin:0 0 12px 0;">Hi ${name},</p>
     <p style="margin:0 0 8px 0;">Your CreatorOS password was just changed and all other sessions were signed out.</p>
     <p style="margin:0;font-size:13px;color:#6B7280;">If this was not you, reset your password immediately.</p>`
  ),
});

export const welcomeEmail = (name: string, link: string): MailTemplate => ({
  subject: 'Welcome to CreatorOS 🎉',
  text: `Hi ${name},

Your CreatorOS account is ready. Open your workspace here:

${link}

— The CreatorOS team`,
  html: shell(
    'Welcome to CreatorOS',
    `<p style="margin:0 0 12px 0;">Hi ${name},</p>
     <p style="margin:0 0 24px 0;">Your email is verified and your workspace is ready. Head in and start building your content engine.</p>
     <p style="margin:0 0 24px 0;">
       <a href="${link}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;
          padding:12px 22px;border-radius:10px;font-size:15px;font-weight:600;">Open my workspace</a>
     </p>`
  ),
});
