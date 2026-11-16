import type { Answer, Prompt } from './types';

/** lowercase, strip accents & punctuation, collapse spaces, drop a leading "the". */
export function normalize(input: string): string {
  let s = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (s.startsWith('the ')) s = s.slice(4);
  return s;
}

/** Comparison key: normalised with spaces removed, so "spider man" == "spiderman". */
export function key(input: string): string {
  return normalize(input).replace(/ /g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Typos allowed for a candidate of this (key) length. */
export function allowedDistance(len: number): number {
  if (len >= 9) return 2;
  if (len >= 5) return 1;
  return 0;
}

/** Find the answer the player meant, or null (= Stall). Exact matches always win over fuzzy ones. */
export function matchAnswer(prompt: Prompt, input: string): Answer | null {
  const k = key(input);
  if (!k) return null;
  let best: Answer | null = null;
  let bestDist = Infinity;
  for (const ans of prompt.answers) {
    for (const form of [ans.text, ...ans.aliases]) {
      const fk = key(form);
      if (fk === k) return ans;
      const max = allowedDistance(fk.length);
      if (max === 0 || Math.abs(fk.length - k.length) > max) continue;
      const d = levenshtein(fk, k);
      if (d <= max && d < bestDist) {
        best = ans;
        bestDist = d;
      }
    }
  }
  return best;
}
