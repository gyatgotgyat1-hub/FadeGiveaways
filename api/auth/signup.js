import { json, setCors, readBody } from '../../lib/db.js';
import { createUser, createAuthSession, publicUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    return res.status(204).end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const body = await readBody(req);
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return json(res, 400, { error: 'Username and password required' });
  }

  const result = await createUser(username, password);
  if (result.error) {
    const status = result.error === 'Already taken' ? 409 : 400;
    return json(res, status, { error: result.error });
  }

  const { token, session } = await createAuthSession(result.user);
  return json(res, 201, {
    token,
    user: publicUser(session),
  });
}
