import { json, setCors, readBody, getAuthToken } from '../../lib/db.js';
import { getAuthSession, revokeAuthSession, publicUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }

  const token = getAuthToken(req);

  if (req.method === 'GET') {
    if (!token) return json(res, 200, { user: null });
    const session = await getAuthSession(token);
    if (!session) return json(res, 200, { user: null });
    return json(res, 200, { user: publicUser(session) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    if (body.action === 'logout') {
      await revokeAuthSession(token);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'Invalid action' });
  }

  if (req.method === 'DELETE') {
    await revokeAuthSession(token);
    return json(res, 200, { ok: true });
  }

  return json(res, 405, { error: 'Method not allowed' });
}
