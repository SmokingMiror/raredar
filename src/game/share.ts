import { GAME_NAME, GAME_URL, TIERS } from './config';
import { feet, isAirborne, rankFor } from './flight';
import type { FlightResult } from './types';

export function shareText(r: Pick<FlightResult, 'points' | 'turns' | 'sortie'>, title?: string): string {
  const height = isAirborne(r.points) ? `${feet(r.points).toLocaleString('en-US')} ft` : 'Never left the runway';
  const squares = r.turns.map((t) => TIERS[t.tier].emoji).join('');
  return `${GAME_NAME} ${title ?? `Sortie #${r.sortie}`} ✈️ ${height} — ${rankFor(r.points).name}\n${squares}\n${GAME_URL}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
