import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, KEYS } from './db.js';

export const ADMIN_USERNAME = 'Admin000';

function authSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PANEL_SECRET || 'fade-giveaways-auth-secret';
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export async function findUser(username) {
  if (!username) return null;
  return dbGet(KEYS.user(username));
}

export async function createUser(username, password) {
  const existing = await findUser(username);
  if (existing) return { error: 'Already taken' };

  if (username.length < 3 || username.length > 24) {
    return { error: 'Username must be 3–24 characters' };
  }

  if (!password || password.length < 1) {
    return { error: 'Password required' };
  }

  const user = {
    id: uuidv4(),
    username,
    passwordHash: hashPassword(password),
    isAdmin: username === ADMIN_USERNAME,
    createdAt: Date.now(),
  };

  await dbSet(KEYS.user(username), user);
  return { user };
}

export async function authenticateUser(username, password) {
  const user = await findUser(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Invalid username or password' };
  }
  return { user };
}

function signPayload(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', authSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function createAuthSession(user) {
  const session = {
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin === true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return { token: signPayload(session), session };
}

export function getAuthSession(token) {
  if (!token || !token.includes('.')) return null;

  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  const expected = createHmac('sha256', authSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const session = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function revokeAuthSession() {
  return;
}

export function publicUser(session) {
  if (!session) return null;
  return {
    username: session.username,
    isAdmin: session.isAdmin === true,
  };
}
