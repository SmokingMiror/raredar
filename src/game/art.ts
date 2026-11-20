import type { TierId } from './types';
import type { ZoneId } from './flight';

/** Generated art lives in /public/img. The SVG drawings remain as fallbacks. */
const TIER_INDEX: Partial<Record<TierId, number>> = { rookie: 1, showboat: 2, wingman: 3, ace: 4, stealth: 5, sonic: 6 };
const ZONE_INDEX: Record<ZoneId, number> = { taxiway: 1, roll: 2, climb: 3, strato: 4, space: 5 };

export const tierImg = (t: TierId) => (TIER_INDEX[t] ? `/img/tier-${TIER_INDEX[t]}.png` : null);
export const rankImg = (level: number) => `/img/rank-${level + 1}.png`;
export const zoneImg = (z: ZoneId) => ({ tall: `/img/zone-${ZONE_INDEX[z]}.png`, wide: `/img/zone-${ZONE_INDEX[z]}-wide.png` });
export const TOWER_IMG = '/img/tower.png';
export const LOGO_IMG = '/img/logo.png';
