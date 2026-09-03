import { json, setCors, readBody, getSessionId, dbGet, dbSet, KEYS } from '../../lib/db.js';
import { getOrCreateSession } from '../../lib/nicknames.js';
import { getAllGiveaways, saveGiveaways, addParticipant } from '../../lib/giveaways.js';
import { sendVerifyEmail } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = await readBody(req);
  const { giveawayId, email } = body;
  const sessionId = getSessionId(req);

  if (!giveawayId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: 'Valid email and giveawayId required' });
  }

  const session = await getOrCreateSession(sessionId, dbGet, dbSet, KEYS);
  if (!session) return json(res, 400, { error: 'Invalid session' });

  const list = await getAllGiveaways();
  const idx = list.findIndex((g) => g.id === giveawayId);
  if (idx === -1) return json(res, 404, { error: 'Giveaway not found' });

  const g = list[idx];
  if (g.status !== 'active' || g.duration <= Date.now()) {
    return json(res, 400, { error: 'Giveaway is not active' });
  }

  const participant = addParticipant(g, {
    email,
    nickname: session.nickname,
    sessionId,
  });

  list[idx] = g;
  await saveGiveaways(list);

  if (!participant.verified && participant.verificationToken) {
    await sendVerifyEmail({
      to: participant.email,
      giveawayName: g.name,
      token: participant.verificationToken,
    });
  }

  return json(res, 200, {
    ok: true,
    verified: participant.verified,
    message: participant.verified
      ? 'Already verified'
      : 'Check your email for the Verify Join button',
  });
}
