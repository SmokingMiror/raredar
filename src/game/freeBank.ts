import bank from '../data/prompts.json';
import type { Prompt } from './types';

/** The Free Flight pool = daily bank + the large free-only bank (lazy-loaded, ~180 KB gzipped). */
const DAILY = bank as Prompt[];
let pool: Prompt[] | null = null;
let loading: Promise<Prompt[]> | null = null;

export function loadFreePool(): Promise<Prompt[]> {
  if (pool) return Promise.resolve(pool);
  loading ??= import('../data/free-prompts.json').then((m) => {
    pool = [...DAILY, ...(m.default as Prompt[])];
    return pool;
  });
  return loading;
}

/** Whatever is available right now (falls back to the daily bank until the free bank has loaded). */
export const freePoolNow = (): Prompt[] => pool ?? DAILY;
