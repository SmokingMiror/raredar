import { AFTERBURNER_BONUS, AFTERBURNER_MIN_POINTS, TIERS } from './config';
import type { TierId, Turn } from './types';

export const TAKEOFF_POINTS = 100;
export const MAX_POINTS = 700;

export type ZoneId = 'taxiway' | 'roll' | 'climb' | 'strato' | 'space';

export interface Zone {
  id: ZoneId;
  name: string;
  from: number;
  banner: string;
}

export const ZONES: Zone[] = [
  { id: 'taxiway', name: 'Taxiway', from: 0, banner: 'TAXIING' },
  { id: 'roll', name: 'Take-off roll', from: 20, banner: 'TAKE-OFF ROLL' },
  { id: 'climb', name: 'Climb', from: 100, banner: 'AIRBORNE' },
  { id: 'strato', name: 'Stratosphere', from: 400, banner: 'ENTERING STRATOSPHERE' },
  { id: 'space', name: 'Edge of space', from: 600, banner: 'EDGE OF SPACE' },
];

export function zoneFor(points: number): Zone {
  let z = ZONES[0];
  for (const zone of ZONES) if (points >= zone.from) z = zone;
  return z;
}

export function isAirborne(points: number) {
  return points >= TAKEOFF_POINTS;
}

export function knots(points: number) {
  return Math.round(Math.min(points, TAKEOFF_POINTS) * 1.5);
}

export function feet(points: number) {
  return Math.max(0, Math.round((points - TAKEOFF_POINTS) * 100));
}

/** "087 KT" on the ground, "24,500 FT" in the air. */
export function readout(points: number): string {
  if (!isAirborne(points)) return `${String(knots(points)).padStart(3, '0')} KT`;
  return `${feet(points).toLocaleString('en-US')} FT`;
}

export interface Rank {
  level: number; // 0–6
  name: string;
  from: number;
}

export const RANKS: Rank[] = [
  { level: 0, name: 'Grounded', from: 0 },
  { level: 1, name: 'Cadet', from: 100 },
  { level: 2, name: 'Pilot Officer', from: 200 },
  { level: 3, name: 'Flight Lieutenant', from: 300 },
  { level: 4, name: 'Squadron Leader', from: 400 },
  { level: 5, name: 'Wing Commander', from: 500 },
  { level: 6, name: 'Top Ace', from: 600 },
];

export function rankFor(points: number): Rank {
  let r = RANKS[0];
  for (const rank of RANKS) if (points >= rank.from) r = rank;
  return r;
}

/** Consecutive Ace-or-better answers ending at the last turn. */
export function streakLength(turns: Pick<Turn, 'tier'>[]): number {
  let n = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (TIERS[turns[i].tier].points >= AFTERBURNER_MIN_POINTS) n++;
    else break;
  }
  return n;
}

/** Afterburner is lit while the streak is 2+. */
export function afterburnerLit(turns: Pick<Turn, 'tier'>[]) {
  return streakLength(turns) >= 2;
}

/** Build the next turn, applying the afterburner bonus from the 3rd Ace+ in a row. */
export function scoreTurn(
  previous: Turn[],
  promptId: string,
  input: string,
  matched: string | null,
  tier: TierId,
): Turn {
  const base = TIERS[tier].points;
  const streak = streakLength([...previous, { tier }]);
  const bonus = streak >= 3 ? AFTERBURNER_BONUS : 0;
  const prevTotal = previous.length ? previous[previous.length - 1].total : 0;
  return { promptId, input, matched, tier, base, bonus, total: prevTotal + base + bonus };
}

/** Sky colours (top, bottom) interpolated through the zones. */
const SKY: [number, string, string][] = [
  [0, '#2a2f3a', '#d98a5a'],
  [60, '#34405a', '#e7a679'],
  [100, '#2d5f98', '#9fcbe9'],
  [300, '#3b82c4', '#b9dcf3'],
  [420, '#1b1f4a', '#3a5c9e'],
  [600, '#0a0c22', '#22306a'],
  [700, '#05060d', '#0f1d44'],
];

/** Accepts #rrggbb or rgb(r,g,b). */
function hexToRgb(h: string) {
  if (h.startsWith('rgb')) return h.slice(h.indexOf('(') + 1, -1).split(',').map(Number);
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

export function skyColors(points: number): [string, string] {
  const p = Math.max(0, Math.min(MAX_POINTS, points));
  for (let i = 0; i < SKY.length - 1; i++) {
    const [p0, t0, b0] = SKY[i];
    const [p1, t1, b1] = SKY[i + 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0);
      return [mix(t0, t1, t), mix(b0, b1, t)];
    }
  }
  const last = SKY[SKY.length - 1];
  return [last[1], last[2]];
}
