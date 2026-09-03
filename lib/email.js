import { Resend } from 'resend';

let resend = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const siteUrl = () => process.env.SITE_URL || 'http://localhost:3000';
const from = () => process.env.EMAIL_FROM || 'FadeGiveaways <onboarding@resend.dev>';

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#e85d3a;color:#0a0a0b;text-decoration:none;padding:12px 28px;border-radius:4px;font-weight:700;font-family:monospace;letter-spacing:0.05em;">${label}</a>`;
}

function wrap(title, body) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#0a0a0b;color:#e8e4df;font-family:Georgia,serif;padding:40px 20px;">
<div style="max-width:520px;margin:0 auto;border:1px solid #2a2a2e;padding:32px;">
<h1 style="font-family:monospace;color:#e85d3a;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 24px;">FadeGiveaways</h1>
<h2 style="font-weight:400;margin:0 0 16px;">${title}</h2>
${body}
<p style="margin-top:32px;font-size:12px;color:#666;font-family:monospace;">— fadegiveaways</p>
</div></body></html>`;
}

export async function sendVerifyEmail({ to, giveawayName, token }) {
  const client = getResend();
  const link = `${siteUrl()}/api/verify?token=${encodeURIComponent(token)}`;
  const html = wrap(
    'Verify your entry',
    `<p>You're joining <strong>${giveawayName}</strong>. Hit the button below to confirm.</p>
<p style="margin:28px 0;">${btn(link, 'Verify Join')}</p>
<p style="font-size:13px;color:#888;">Or paste this link: ${link}</p>`
  );

  if (!client) {
    console.log('[dev email] Verify:', to, link);
    return { ok: true, dev: true };
  }

  await client.emails.send({ from: from(), to, subject: `Verify — ${giveawayName}`, html });
  return { ok: true };
}

export async function sendEnteredEmail({ to, giveawayName }) {
  const client = getResend();
  const html = wrap(
    "You're in",
    `<p>U have entered <strong>${giveawayName}</strong>.</p>
<p>Good luck — we'll hit your inbox if you win.</p>`
  );

  if (!client) {
    console.log('[dev email] Entered:', to, giveawayName);
    return { ok: true, dev: true };
  }

  await client.emails.send({ from: from(), to, subject: `Entered — ${giveawayName}`, html });
  return { ok: true };
}

export async function sendWinnerEmail({ to, giveawayName, downloadLink, keys }) {
  const client = getResend();
  const keyBlock = keys.length
    ? `<p><strong>Your key${keys.length > 1 ? 's' : ''}:</strong></p><pre style="background:#111;padding:16px;font-family:monospace;color:#f4a261;overflow-x:auto;">${keys.join('\n')}</pre>`
    : '';

  const html = wrap(
    'You won',
    `<p>Congrats — you won <strong>${giveawayName}</strong>.</p>
<p>Here's your download link:</p>
<p style="margin:20px 0;">${btn(downloadLink, 'Download')}</p>
${keyBlock}
<p style="font-size:13px;color:#888;">Direct link: ${downloadLink}</p>`
  );

  if (!client) {
    console.log('[dev email] Winner:', to, giveawayName, downloadLink, keys);
    return { ok: true, dev: true };
  }

  await client.emails.send({ from: from(), to, subject: `You won — ${giveawayName}`, html });
  return { ok: true };
}
