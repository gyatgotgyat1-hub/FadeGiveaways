import { verifyParticipant } from '../../lib/giveaways.js';
import { sendEnteredEmail } from '../../lib/email.js';

const siteUrl = () => process.env.SITE_URL || 'http://localhost:3000';

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlPage(title, message, success) {
  const color = success ? '#4ade80' : '#e85d3a';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — FadeGiveaways</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0b;color:#e8e4df;font-family:'Syne',sans-serif;padding:24px}
  .card{max-width:440px;border:1px solid #2a2a2e;padding:40px;text-align:center}
  h1{font-family:'IBM Plex Mono',monospace;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;color:${color};margin-bottom:20px}
  p{line-height:1.7;color:#aaa;font-size:15px}
  a{display:inline-block;margin-top:28px;color:#0a0a0b;background:#e85d3a;text-decoration:none;padding:12px 24px;font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase}
</style>
</head>
<body>
<div class="card">
  <h1>${title}</h1>
  <p>${message}</p>
  <a href="${siteUrl()}">Back to FadeGiveaways</a>
</div>
</body>
</html>`;
}

export default async function handler(req, res) {
  const token = req.query?.token;

  if (!token) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(htmlPage('Missing token', 'This verification link is invalid.', false));
  }

  const result = await verifyParticipant(token);
  if (!result) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(htmlPage('Already verified or expired', 'This link may have already been used.', false));
  }

  await sendEnteredEmail({
    to: result.participant.email,
    giveawayName: result.giveaway.name,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(
    htmlPage(
      'Verified',
      `You're in <strong>${escapeHtml(result.giveaway.name)}</strong>. Head back to the site and hit <em>Refresh Verify</em>.`,
      true
    )
  );
}
