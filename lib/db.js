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

export async function dbDel(key) {
  const r = getRedis();
  if (r) return r.del(key);
  memory.delete(key);
}

export const KEYS = {
  giveaways: 'fg:giveaways',
  session: (id) => `fg:session:${id}`,
  adminToken: (token) => `fg:admin:${token}`,
  user: (username) => `fg:user:${username}`,
  auth: (token) => `fg:auth:${token}`,
};

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id, X-Auth-Token');
}

export function json(res, status, data) {
  setCors(res);
  res.status(status).json(data);
}

export function getSessionId(req) {
  return req.headers['x-session-id'] || '';
}

export function getAuthToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return req.headers['x-auth-token'] || '';
}

export function getAdminToken(req) {
  return getAuthToken(req);
}

export async function requireAdmin(req) {
  const { getAuthSession } = await import('./auth.js');
  const token = getAuthToken(req);
  if (!token) return false;
  const session = await getAuthSession(token);
  return session?.isAdmin === true;
}

export async function getAuthUser(req) {
  const { getAuthSession } = await import('./auth.js');
  const token = getAuthToken(req);
  if (!token) return null;
  return getAuthSession(token);
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
