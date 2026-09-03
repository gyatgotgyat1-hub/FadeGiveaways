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
  const signal = String(body.k || body.sequence || '').toLowerCase().trim();
  const alt = body.alt === 1 || body.alt === true || body.alt === '1';
  const taps = Number(body.t);

  if (!signal || signal !== secret) {
    return json(res, 403, { error: 'Invalid' });
  }

  if (!alt && taps !== 4) {
    return json(res, 403, { error: 'Invalid' });
  }

  const token = uuidv4();
  await dbSet(KEYS.adminToken(token), { createdAt: Date.now() });

  return json(res, 200, { token, expiresIn: '24h' });
}
