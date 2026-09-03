import { json, setCors, readBody } from '../../lib/db.js';
import { checkParticipantVerified } from '../../lib/giveaways.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = await readBody(req);
  const { giveawayId, email } = body;

  if (!giveawayId || !email) {
    return json(res, 400, { error: 'giveawayId and email required' });
  }

  const participant = await checkParticipantVerified(giveawayId, email);
  if (!participant) return json(res, 404, { error: 'Entry not found' });

  return json(res, 200, {
    verified: participant.verified,
    nickname: participant.nickname,
  });
}
