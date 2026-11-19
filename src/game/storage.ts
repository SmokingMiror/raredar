import { previousDateKey } from './daily';
import type { FlightResult, Turn } from './types';
import { DEFAULT_SETTINGS, type Settings } from '../settings';

const KEY = 'raredar:v1';
/** Saves from before the rename are picked up once and carried over. */
const OLD_KEYS = ['mach7:v1'];

export interface Save {
  history: Record<string, FlightResult>;
  /** Daily flight in progress, so a refresh can't reroll a prompt. */
  inProgress: { dateKey: string; turns: Turn[]; startedAt?: number } | null;
  flightHours: number;
  sortieStreak: number;
  bestStreak: number;
  lastSortieDate: string | null;
  bestPoints: number;
  suggestions: { promptId: string; text: string; at: number }[];
  settings: Settings;
  seenBriefing: boolean;
  /** Today's randomly picked prompt ids (random daily mode). */
  dailyPicks: { dateKey: string; ids: string[] }[];
  selectedJet: string;
  selectedPaint: string;
  /** Best points per non-daily mode. */
  records: { classic: number; endurance: number; packs: Record<string, number>; archive: Record<string, number> };
  freeFlights: number;
}

const fresh = (): Save => ({
  history: {},
  inProgress: null,
  flightHours: 0,
  sortieStreak: 0,
  bestStreak: 0,
  lastSortieDate: null,
  bestPoints: 0,
  suggestions: [],
  settings: { ...DEFAULT_SETTINGS },
  seenBriefing: false,
  dailyPicks: [],
  selectedJet: 'swift',
  selectedPaint: 'arctic',
  records: { classic: 0, endurance: 0, packs: {}, archive: {} },
  freeFlights: 0,
});

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY) ?? OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean) ?? null;
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings }, records: { ...base.records, ...parsed.records } };
  } catch {
    return fresh();
  }
}

export function persist(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* private mode / quota: play on without saving */
  }
}

/** Current streak, treating a gap of more than one day as broken. */
export function liveStreak(save: Save, today: string): number {
  if (!save.lastSortieDate) return 0;
  if (save.lastSortieDate === today || save.lastSortieDate === previousDateKey(today)) return save.sortieStreak;
  return 0;
}

/** Pure: returns the save after finishing a daily sortie. */
export function recordDaily(save: Save, result: FlightResult): Save {
  if (save.history[result.dateKey]) return save;
  const continues = save.lastSortieDate === previousDateKey(result.dateKey);
  const streak = continues ? save.sortieStreak + 1 : 1;
  return {
    ...save,
    history: { ...save.history, [result.dateKey]: result },
    inProgress: null,
    flightHours: save.flightHours + result.points,
    sortieStreak: streak,
    bestStreak: Math.max(save.bestStreak, streak),
    lastSortieDate: result.dateKey,
    bestPoints: Math.max(save.bestPoints, result.points),
  };
}

/** Ensure there is a pick for `today`; keeps the last few days so they can be avoided. */
export function withDailyPicks(save: Save, today: string, pick: (recent: Set<string>) => string[], keep: number): Save {
  if (save.dailyPicks.some((d) => d.dateKey === today)) return save;
  const recent = new Set(save.dailyPicks.slice(-keep).flatMap((d) => d.ids));
  return { ...save, dailyPicks: [...save.dailyPicks, { dateKey: today, ids: pick(recent) }].slice(-(keep + 1)) };
}

export type FreeKind = 'classic' | 'endurance' | 'pack' | 'archive';

/** Pure: record a non-daily flight. Adds flight hours; never touches the streak. */
export function recordFree(save: Save, kind: FreeKind, points: number, key?: string): Save {
  const r = save.records;
  const records =
    kind === 'pack' && key
      ? { ...r, packs: { ...r.packs, [key]: Math.max(r.packs[key] ?? 0, points) } }
      : kind === 'archive' && key
        ? { ...r, archive: { ...r.archive, [key]: Math.max(r.archive[key] ?? 0, points) } }
        : kind === 'classic' || kind === 'endurance'
          ? { ...r, [kind]: Math.max(r[kind], points) }
          : r;
  return { ...save, records, flightHours: save.flightHours + points, freeFlights: save.freeFlights + 1 };
}
