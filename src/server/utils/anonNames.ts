import fs from 'fs';
import path from 'path';
import { redis } from '@devvit/web/server';
// Import the usernames JSON at build-time so the name pool is available even when
// runtime filesystem paths differ (Devvit/playtest environments can alter cwd).
import usernamesJson from '../data/usernames.json';

// Anonymous name allocator
// - Loads a local pool of names from `src/server/data/usernames.json`
// - Persists mappings in Redis using a hash: `anon:mapping` (userId -> anonName)
// - Tracks used names in hash `anon:used` (anonName -> userId)
// - Maintains pointer `anon:nextIndex` and overflow counter `anon:overflowCounter`

const NAMES_JSON_CANDIDATES = [
  path.join(process.cwd(), 'src', 'server', 'data', 'usernames.json'),
  path.join(__dirname, '..', 'data', 'usernames.json'),
  path.join(process.cwd(), 'dist', 'server', '..', 'src', 'server', 'data', 'usernames.json'),
];

let baseNames: string[] | null = null;

function loadNamesFromDisk(): void {
  if (baseNames !== null) return;
  for (const p of NAMES_JSON_CANDIDATES) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const obj = JSON.parse(raw) as Record<string, string>;
        // Sort keys like username1, username2... to maintain deterministic order
        const keys = Object.keys(obj).sort((a, b) => {
          const na = parseInt(a.replace(/[^0-9]/g, '') || '0', 10);
          const nb = parseInt(b.replace(/[^0-9]/g, '') || '0', 10);
          return na - nb;
        });
        baseNames = keys.map(k => obj[k]).filter((v): v is string => typeof v === 'string');
        return;
      }
    } catch (e) {
      // try next
    }
  }

  // Fallback to build-time JSON if file not found on disk
  try {
    if (usernamesJson && typeof usernamesJson === 'object') {
      const keys = Object.keys(usernamesJson).sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, '') || '0', 10);
        const nb = parseInt(b.replace(/[^0-9]/g, '') || '0', 10);
        return na - nb;
      });
      baseNames = keys.map(k => (usernamesJson as Record<string, string>)[k]).filter((v): v is string => typeof v === 'string');
      return;
    }
  } catch (e) {
    // fall through to tiny fallback
  }

  // Tiny deterministic fallback if everything else fails
  baseNames = ['PlayerOne', 'PlayerTwo', 'PlayerThree'];
}

const KEY_MAPPING = 'anon:mapping'; // hash userId -> anonName
const KEY_USED = 'anon:used'; // hash anonName -> userId
const KEY_NEXT = 'anon:nextIndex';
const KEY_OVERFLOW = 'anon:overflowCounter';
const OVERFLOW_START = 6001;

export async function getAssignedAnonName(userId: string): Promise<string | null> {
  if (!userId) return null;
  const existing = await redis.hGet(KEY_MAPPING, userId);
  return existing || null;
}

export async function assignAnonName(userId: string): Promise<string> {
  if (!userId) throw new Error('userId is required');
  loadNamesFromDisk();
  const names = baseNames as string[];

  // Check existing mapping first
  const existing = await redis.hGet(KEY_MAPPING, userId);
  if (existing) return existing;

  // Get pointer and used count
  const nextRaw = await redis.get(KEY_NEXT);
  let next = nextRaw ? parseInt(nextRaw, 10) : 0;
  if (Number.isNaN(next)) next = 0;

  // Try to find an unused base name (single pass)
  const total = names.length;
  for (let i = 0; i < total; i++) {
    const idx = (next + i) % total;
    const candidate = names[idx];
    if (!candidate) continue;
    const usedBy = await redis.hGet(KEY_USED, candidate);
    if (!usedBy) {
      // Assign (hSet accepts an object mapping)
      await redis.hSet(KEY_MAPPING, { [userId]: candidate } as any);
      await redis.hSet(KEY_USED, { [candidate]: userId } as any);
      // Advance pointer to next after idx
      const newNext = (idx + 1) % total;
      await redis.set(KEY_NEXT, String(newNext));
      return candidate;
    }
  }

  // All base names used — fall back to overflow numbering
  let overflowRaw = await redis.get(KEY_OVERFLOW);
  let overflow = overflowRaw ? parseInt(overflowRaw, 10) : OVERFLOW_START;
  if (Number.isNaN(overflow) || overflow < OVERFLOW_START) overflow = OVERFLOW_START;

  // Find a unique overflowed name by appending the counter
  let assigned: string | null = null;
  let attempts = 0;
  while (assigned === null && attempts < 1000000) {
    for (let j = 0; j < total; j++) {
      const base = names[j];
      if (!base) continue;
      const candidate = `username${overflow}${base}`; // e.g. username6001wordmaster
      const usedBy = await redis.hGet(KEY_USED, candidate);
      if (!usedBy) {
        assigned = candidate;
        break;
      }
      overflow++;
      attempts++;
    }
  }

  if (!assigned) {
    // Fallback deterministic name
    assigned = `username${Date.now()}:${userId.slice(-6)}`;
  }

  // Persist assignment and update overflow counter
  await redis.hSet(KEY_MAPPING, { [userId]: assigned } as any);
  await redis.hSet(KEY_USED, { [assigned]: userId } as any);
  await redis.set(KEY_OVERFLOW, String(overflow + 1));

  return assigned;
}

export async function releaseAnonNameForUser(userId: string): Promise<void> {
  const existing = await redis.hGet(KEY_MAPPING, userId);
  if (!existing) return;
  await redis.hDel(KEY_MAPPING, [userId] as any);
  await redis.hDel(KEY_USED, [existing] as any);
}

export default {
  getAssignedAnonName,
  assignAnonName,
  releaseAnonNameForUser,
};
