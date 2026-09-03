const ADJECTIVES = [
  'Faded', 'Silent', 'Neon', 'Rust', 'Ghost', 'Iron', 'Velvet', 'Cipher',
  'Ash', 'Copper', 'Drift', 'Hollow', 'Static', 'Wired', 'Pale', 'Rogue',
];

const NOUNS = [
  'Fox', 'Rook', 'Viper', 'Crow', 'Wolf', 'Moth', 'Shard', 'Pulse',
  'Echo', 'Flare', 'Node', 'Glyph', 'Spark', 'Veil', 'Rift', 'Bolt',
];

export function generateNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
}

export async function getOrCreateSession(sessionId, dbGet, dbSet, KEYS) {
  if (!sessionId) return null;
  const key = KEYS.session(sessionId);
  let session = await dbGet(key);
  if (!session) {
    session = { id: sessionId, nickname: generateNickname(), createdAt: Date.now() };
    await dbSet(key, session);
  }
  return session;
}
