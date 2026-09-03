import { json, setCors } from '../../lib/db.js';
import { getAllGiveaways, publicGiveaway, processEndedGiveaways } from '../../lib/giveaways.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  await processEndedGiveaways();
  const list = await getAllGiveaways();
  const active = list
    .filter((g) => g.status === 'active')
    .map(publicGiveaway)
    .sort((a, b) => a.duration - b.duration);

  return json(res, 200, { giveaways: active });
}
