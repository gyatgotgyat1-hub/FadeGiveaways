import { json, setCors, readBody, requireAdmin } from '../../../lib/db.js';
import { getAllGiveaways, saveGiveaways, createGiveaway } from '../../../lib/giveaways.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  const authed = await requireAdmin(req);
  if (!authed) return json(res, 401, { error: 'Admin access required' });

  if (req.method === 'GET') {
    const list = await getAllGiveaways();
    const sanitized = list.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      vouch: g.vouch,
      duration: g.duration,
      downloadLink: g.downloadLink,
      keysRemaining: g.keys.length,
      status: g.status,
      endedAt: g.endedAt,
      winnerNickname: g.winnerNickname,
      participants: g.participants.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        email: p.email,
        verified: p.verified,
        rigged: p.rigged,
        enteredAt: p.enteredAt,
      })),
    }));
    return json(res, 200, { giveaways: sanitized });
  }

  if (req.method === 'POST') {
    try {
      const body = await readBody(req);
      if (!body.name || !body.downloadLink) {
        return json(res, 400, { error: 'Name and download link required' });
      }

      const giveaway = createGiveaway(body);
      const list = await getAllGiveaways();
      list.push(giveaway);
      await saveGiveaways(list);

      return json(res, 201, { giveaway: { id: giveaway.id, name: giveaway.name } });
    } catch (err) {
      console.error('Create giveaway error:', err);
      return json(res, 500, { error: 'Failed to save giveaway. Check Upstash Redis is configured.' });
    }
  }

  return json(res, 405, { error: 'Method not allowed' });
}
