import { v4 as uuidv4 } from 'uuid';
import { json, setCors, readBody, dbSet, KEYS } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = await readBody(req);
  const secret = (process.env.ADMIN_PANEL_SECRET || 'adminpanel').trim().toLowerCase();
  const sequence = String(body.sequence || '').toLowerCase();

  if (!sequence || (sequence !== secret && !sequence.endsWith(secret))) {
    return json(res, 403, { error: 'Invalid sequence' });
  }

  const token = uuidv4();
  await dbSet(KEYS.adminToken(token), { createdAt: Date.now() });

  return json(res, 200, { token, expiresIn: '24h' });
}
