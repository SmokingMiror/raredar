import type { TierId } from './types';

/** Working title. Change it here and in index.html. */
export const GAME_NAME = 'Mach 7';
export const TAGLINE = 'Rare answers fly higher.';
export const GAME_URL = 'https://mach7.example';

export const PROMPTS_PER_FLIGHT = 7;
export const SECONDS_PER_PROMPT = 25;

/** Afterburner streak: two Ace-or-better answers in a row lights it;
 *  from the third in a row each answer earns this bonus. Set to 0 for a pure 700 max. */
export const AFTERBURNER_BONUS = 10;
export const AFTERBURNER_MIN_POINTS = 60;

/** 'random': each player gets their own random 7 each day (saved, so a refresh doesn't reroll).
 *  'shared': everyone gets the same 7, seeded from the UTC date. */
export const DAILY_MODE: 'random' | 'shared' = 'random';
/** Random mode avoids repeating prompts seen in this many recent days. */
export const RECENT_DAYS = 6;

/** Day 1 of the daily sortie counter (UTC). */
export const LAUNCH_DATE = '2026-11-01';

export interface TierInfo {
  id: TierId;
  name: string;
  points: number;
  color: string;
  emoji: string;
  /** Thrust strength 0–1 used by the scene. */
  thrust: number;
}

export const TIERS: Record<TierId, TierInfo> = {
  stall: { id: 'stall', name: 'Stall', points: 0, color: '#ff4d4d', emoji: '⬛', thrust: 0 },
  rookie: { id: 'rookie', name: 'Rookie', points: 10, color: '#9aa4b2', emoji: '⬜', thrust: 0.15 },
  showboat: { id: 'showboat', name: 'Showboat', points: 15, color: '#ffb347', emoji: '🟧', thrust: 0.2 },
  wingman: { id: 'wingman', name: 'Wingman', points: 30, color: '#4da3ff', emoji: '🟦', thrust: 0.4 },
  ace: { id: 'ace', name: 'Ace', points: 60, color: '#6cff8f', emoji: '🟩', thrust: 0.65 },
  stealth: { id: 'stealth', name: 'Stealth', points: 85, color: '#b77cff', emoji: '🟪', thrust: 0.85 },
  sonic: { id: 'sonic', name: 'Sonic Boom', points: 100, color: '#ffe08a', emoji: '🟨', thrust: 1 },
};

export const TIER_ORDER: TierId[] = ['sonic', 'stealth', 'ace', 'wingman', 'showboat', 'rookie', 'stall'];
