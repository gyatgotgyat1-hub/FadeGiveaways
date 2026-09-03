import { json } from '../../lib/db.js';
import { processEndedGiveaways } from '../../lib/giveaways.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return json(res, 401, { error: 'Unauthorized' });
    }
  }

  await processEndedGiveaways();
  return json(res, 200, { ok: true, processedAt: Date.now() });
}
