import jets from '../data/jets.json';
import paints from '../data/paints.json';
import type { JetId, Paint } from '../components/Jet';

export interface JetInfo {
  id: JetId;
  name: string;
  blurb: string;
  image: string;
  unlockAtFlightHours: number;
}
export interface PaintInfo extends Paint {
  id: string;
  name: string;
  unlockAtFlightHours: number;
}

export const JETS = jets as JetInfo[];
export const PAINTS = paints as PaintInfo[];

export const isUnlocked = (item: { unlockAtFlightHours: number }, hours: number) => hours >= item.unlockAtFlightHours;

/** Jets and paints that unlock when flight hours go from `before` to `after`. */
export function newUnlocks(before: number, after: number): string[] {
  return [...JETS, ...PAINTS]
    .filter((i) => !isUnlocked(i, before) && isUnlocked(i, after))
    .map((i) => ('blurb' in i ? `${i.name} (jet)` : `${i.name} paint`));
}

/** Next thing to unlock and how far along the player is. */
export function nextUnlock(hours: number) {
  const next = [...JETS, ...PAINTS].filter((i) => !isUnlocked(i, hours)).sort((a, b) => a.unlockAtFlightHours - b.unlockAtFlightHours)[0];
  return next ? { name: next.name, at: next.unlockAtFlightHours } : null;
}

export function jetById(id: string) {
  return JETS.find((j) => j.id === id) ?? JETS[0];
}
export function paintById(id: string) {
  return PAINTS.find((p) => p.id === id) ?? PAINTS[0];
}
