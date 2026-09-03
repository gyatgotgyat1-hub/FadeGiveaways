import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, dbDel, KEYS } from './db.js';

export const ADMIN_USERNAME = 'Admin000';

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

export async function createAuthSession(user) {
  const token = uuidv4();
  const session = {
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin === true,
    createdAt: Date.now(),
  };
  await dbSet(KEYS.auth(token), session);
  return { token, session };
}

export async function getAuthSession(token) {
  if (!token) return null;
  return dbGet(KEYS.auth(token));
}

export async function revokeAuthSession(token) {
  if (!token) return;
  await dbDel(KEYS.auth(token));
}

export function publicUser(session) {
  if (!session) return null;
  return {
    username: session.username,
    isAdmin: session.isAdmin === true,
  };
}
