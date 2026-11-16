import { feet, isAirborne } from './flight';
import type { FlightResult, TierId } from './types';

export interface ServiceStats {
  sorties: number;
  averageFeet: number;
  bestFeet: number;
  takeoffRate: number; // 0–1
  tierCounts: Record<TierId, number>;
  answers: number;
}

export function serviceStats(history: Record<string, FlightResult>): ServiceStats {
  const flights = Object.values(history);
  const tierCounts: Record<TierId, number> = { sonic: 0, stealth: 0, ace: 0, wingman: 0, showboat: 0, rookie: 0, stall: 0 };
  for (const f of flights) for (const t of f.turns) tierCounts[t.tier]++;
  const n = flights.length;
  return {
    sorties: n,
    averageFeet: n ? Math.round(flights.reduce((s, f) => s + feet(f.points), 0) / n) : 0,
    bestFeet: Math.max(0, ...flights.map((f) => feet(f.points))),
    takeoffRate: n ? flights.filter((f) => isAirborne(f.points)).length / n : 0,
    tierCounts,
    answers: flights.reduce((s, f) => s + f.turns.length, 0),
  };
}

export interface MedalInput {
  bestStreak: number;
  history: Record<string, FlightResult>;
}

export interface Medal {
  id: string;
  name: string;
  desc: string;
  earned: (s: MedalInput) => boolean;
}

const flights = (s: MedalInput) => Object.values(s.history);

export const MEDALS: Medal[] = [
  { id: 'wheels-up', name: 'Wheels Up', desc: 'Get off the runway for the first time', earned: (s) => flights(s).some((f) => isAirborne(f.points)) },
  { id: 'boom', name: 'Sound Barrier', desc: 'Find a Sonic Boom answer', earned: (s) => flights(s).some((f) => f.turns.some((t) => t.tier === 'sonic')) },
  { id: 'clean', name: 'Clean Sheet', desc: 'Fly a sortie with no Stalls', earned: (s) => flights(s).some((f) => f.turns.length === 7 && f.turns.every((t) => t.tier !== 'stall')) },
  { id: 'strato', name: 'Thin Air', desc: 'Reach the stratosphere (30,000 ft)', earned: (s) => flights(s).some((f) => f.points >= 400) },
  { id: 'space', name: 'Edge of Space', desc: 'Reach 50,000 ft', earned: (s) => flights(s).some((f) => f.points >= 600) },
  { id: 'streak-7', name: 'Week on Watch', desc: '7 consecutive sorties', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', name: 'Month Aloft', desc: '30 consecutive sorties', earned: (s) => s.bestStreak >= 30 },
  { id: 'streak-100', name: 'Centurion', desc: '100 consecutive sorties', earned: (s) => s.bestStreak >= 100 },
];

export function earnedMedals(s: MedalInput): string[] {
  return MEDALS.filter((m) => m.earned(s)).map((m) => m.id);
}

/** Medals in `after` that weren't in `before`. */
export function newMedals(before: MedalInput, after: MedalInput): Medal[] {
  const had = new Set(earnedMedals(before));
  return MEDALS.filter((m) => !had.has(m.id) && m.earned(after));
}
