import { Redis } from '@upstash/redis';

let redis = null;
const memory = new Map();

function useMemory() {
  return !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
}

export function getRedis() {
  if (useMemory()) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export async function dbGet(key) {
  const r = getRedis();
  if (r) return r.get(key);
  return memory.get(key) ?? null;
}

export async function dbSet(key, value) {
  const r = getRedis();
  if (r) return r.set(key, value);
  memory.set(key, value);
}

export const KEYS = {
  giveaways: 'fg:giveaways',
  session: (id) => `fg:session:${id}`,
  adminToken: (token) => `fg:admin:${token}`,
};

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
}

export function json(res, status, data) {
  setCors(res);
  res.status(status).json(data);
}

export function getSessionId(req) {
  return req.headers['x-session-id'] || '';
}

export function getAdminToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.headers['x-admin-token'] || '';
}

export async function requireAdmin(req) {
  const token = getAdminToken(req);
  if (!token) return false;
  const secret = (process.env.ADMIN_PANEL_SECRET || 'adminpanel').trim().toLowerCase();
  if (token.toLowerCase() === secret) return true;
  const stored = await dbGet(KEYS.adminToken(token));
  return !!stored;
}

export async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try { return req.body ? JSON.parse(req.body) : {}; }
    catch { return {}; }
  }

  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}
