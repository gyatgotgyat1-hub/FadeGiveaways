import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbSet, KEYS } from './db.js';
import { sendWinnerEmail } from './email.js';

export async function getAllGiveaways() {
  const data = await dbGet(KEYS.giveaways);
  return Array.isArray(data) ? data : [];
}

export async function saveGiveaways(list) {
  await dbSet(KEYS.giveaways, list);
}

export async function getGiveaway(id) {
  const list = await getAllGiveaways();
  return list.find((g) => g.id === id) || null;
}

export function publicGiveaway(g) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    vouch: g.vouch,
    duration: g.duration,
    status: g.status,
    endedAt: g.endedAt || null,
    winnerNickname: g.winnerNickname || null,
  };
}

export async function processEndedGiveaways() {
  const list = await getAllGiveaways();
  const now = Date.now();
  let changed = false;

  for (const g of list) {
    if (g.status !== 'active' || g.duration > now) continue;

    const verified = g.participants.filter((p) => p.verified);
    if (verified.length === 0) {
      g.status = 'ended';
      g.endedAt = now;
      changed = true;
      continue;
    }

    let winner = verified.find((p) => p.rigged);
    if (!winner) {
      winner = verified[Math.floor(Math.random() * verified.length)];
    }

    g.status = 'ended';
    g.endedAt = now;
    g.winnerId = winner.id;
    g.winnerNickname = winner.nickname;
    g.winnerEmail = winner.email;
    changed = true;

    const keys = [...g.keys];
    g.keys = [];

    await sendWinnerEmail({
      to: winner.email,
      giveawayName: g.name,
      downloadLink: g.downloadLink,
      keys,
    });
  }

  if (changed) await saveGiveaways(list);
  return list;
}

export function createGiveaway(data) {
  const keys = (data.keysText || '')
    .split('\n')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    id: uuidv4(),
    name: data.name,
    description: data.description,
    vouch: data.vouch || '',
    duration: Date.now() + Number(data.durationMinutes || 60) * 60 * 1000,
    downloadLink: data.downloadLink,
    keys: [...keys],
    keyPool: [...keys],
    participants: [],
    status: 'active',
    createdAt: Date.now(),
    riggedParticipantId: null,
    winnerId: null,
    winnerNickname: null,
    winnerEmail: null,
    endedAt: null,
  };
}

export function addParticipant(giveaway, { email, nickname, sessionId }) {
  const existing = giveaway.participants.find(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) return existing;

  const participant = {
    id: uuidv4(),
    email: email.toLowerCase(),
    nickname,
    sessionId,
    verified: false,
    verificationToken: uuidv4(),
    rigged: false,
    enteredAt: Date.now(),
    verifiedAt: null,
  };
  giveaway.participants.push(participant);
  return participant;
}

export async function verifyParticipant(token) {
  const list = await getAllGiveaways();
  for (const g of list) {
    const p = g.participants.find((x) => x.verificationToken === token);
    if (!p || p.verified) continue;
    p.verified = true;
    p.verifiedAt = Date.now();
    p.verificationToken = null;
    await saveGiveaways(list);
    return { giveaway: g, participant: p };
  }
  return null;
}

export async function checkParticipantVerified(giveawayId, email) {
  const g = await getGiveaway(giveawayId);
  if (!g) return null;
  const p = g.participants.find((x) => x.email.toLowerCase() === email.toLowerCase());
  return p || null;
}

export async function rigParticipant(giveawayId, participantId) {
  const list = await getAllGiveaways();
  const g = list.find((x) => x.id === giveawayId);
  if (!g) return null;

  for (const p of g.participants) {
    p.rigged = p.id === participantId;
  }
  g.riggedParticipantId = participantId;
  await saveGiveaways(list);
  return g;
}
