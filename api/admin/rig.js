import { json, setCors, readBody, requireAdmin } from '../../../lib/db.js';
import { rigParticipant } from '../../../lib/giveaways.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const authed = await requireAdmin(req);
  if (!authed) return json(res, 401, { error: 'Admin access required' });

  const body = await readBody(req);
  const { giveawayId, participantId } = body;

  if (!giveawayId || !participantId) {
    return json(res, 400, { error: 'giveawayId and participantId required' });
  }

  const result = await rigParticipant(giveawayId, participantId);
  if (!result) return json(res, 404, { error: 'Giveaway not found' });

  return json(res, 200, { ok: true, riggedParticipantId: participantId });
}
