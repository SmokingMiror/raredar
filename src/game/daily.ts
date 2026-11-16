import { LAUNCH_DATE, PROMPTS_PER_FLIGHT } from './config';
import type { Prompt } from './types';

const DAY = 86_400_000;

/** YYYY-MM-DD in UTC. */
export function dateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function sortieNumber(key: string = dateKey()): number {
  return Math.floor((Date.parse(key) - Date.parse(LAUNCH_DATE)) / DAY) + 1;
}

export function previousDateKey(key: string): string {
  return dateKey(new Date(Date.parse(key) - DAY));
}

export function msToNextSortie(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Same 7 prompts for everyone on a given UTC date. Sorted by id first so bank order doesn't matter. */
export function dailyPrompts(bank: Prompt[], key: string = dateKey()): Prompt[] {
  const sorted = bank.slice().sort((a, b) => a.id.localeCompare(b.id));
  return shuffle(sorted, mulberry32(hash(`sortie:${key}`))).slice(0, PROMPTS_PER_FLIGHT);
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** A random set of prompts: spread across categories, avoiding ids in `recent` where possible. */
export function randomPrompts(bank: Prompt[], recent: Set<string> = new Set(), count = PROMPTS_PER_FLIGHT, rand: () => number = Math.random): Prompt[] {
  const shuffled = shuffle(bank, rand);
  const fresh = shuffled.filter((p) => !recent.has(p.id));
  const stale = shuffled.filter((p) => recent.has(p.id));
  const out: Prompt[] = [];
  const cats = new Set<string>();
  // pass 1: fresh prompts from new categories; pass 2: any fresh; pass 3: recently seen
  for (const pass of [0, 1, 2]) {
    for (const p of pass === 2 ? stale : fresh) {
      if (out.length >= count) break;
      if (out.includes(p)) continue;
      if (pass === 0 && cats.has(p.category)) continue;
      out.push(p);
      cats.add(p.category);
    }
  }
  return out;
}
