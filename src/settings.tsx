import { createContext, useContext, useEffect, useState } from 'react';
import { TIERS } from './game/config';
import type { TierId } from './game/types';
import { DEFAULT_PAINT, type JetId, type Paint } from './components/Jet';

export interface Settings {
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
  colorBlind: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: false, music: false, reducedMotion: false, colorBlind: false };

/** Okabe–Ito based palette, distinguishable with the common forms of colour blindness. */
const CB_COLORS: Record<TierId, string> = {
  stall: '#d55e00',
  rookie: '#bbbbbb',
  showboat: '#e69f00',
  wingman: '#56b4e9',
  ace: '#f0e442',
  stealth: '#cc79a7',
  sonic: '#ffffff',
};

/** One-letter cue shown on tier squares in colour-blind mode. */
export const TIER_LETTER: Record<TierId, string> = {
  stall: '×',
  rookie: 'R',
  showboat: 'S',
  wingman: 'W',
  ace: 'A',
  stealth: 'X',
  sonic: '!',
};

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

export const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, update: () => {} });

export function useSettings() {
  return useContext(SettingsContext);
}

export function useTierColor(): (tier: TierId) => string {
  const { settings } = useSettings();
  return (tier) => (settings.colorBlind ? CB_COLORS[tier] : TIERS[tier].color);
}

/** System preference OR the in-game setting. */
export function useReducedMotion(): boolean {
  const { settings } = useSettings();
  const q = '(prefers-reduced-motion: reduce)';
  const [system, setSystem] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const on = () => setSystem(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return system || settings.reducedMotion;
}

/** The player's chosen jet and paint, used by every JetScene unless overridden. */
export const LoadoutContext = createContext<{ jet: JetId; paint: Paint }>({ jet: 'swift', paint: DEFAULT_PAINT });
export const useLoadout = () => useContext(LoadoutContext);
