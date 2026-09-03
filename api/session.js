import { v4 as uuidv4 } from 'uuid';
import { json, getSessionId, dbGet, dbSet, KEYS, setCors } from '../../lib/db.js';
import { getOrCreateSession } from '../../lib/nicknames.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    let sessionId = getSessionId(req);
    if (!sessionId) sessionId = uuidv4();

    const session = await getOrCreateSession(sessionId, dbGet, dbSet, KEYS);
    return json(res, 200, { sessionId, nickname: session.nickname });
  }

  return json(res, 405, { error: 'Method not allowed' });
}
