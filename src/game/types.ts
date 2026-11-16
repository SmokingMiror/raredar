export type TierId = 'stall' | 'rookie' | 'showboat' | 'wingman' | 'ace' | 'stealth' | 'sonic';

export interface Answer {
  text: string;
  aliases: string[];
  tier: Exclude<TierId, 'stall'>;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  answers: Answer[];
}

/** One answered prompt inside a flight. */
export interface Turn {
  promptId: string;
  input: string;
  /** Canonical text of the matched answer, or null for a Stall. */
  matched: string | null;
  tier: TierId;
  base: number;
  bonus: number;
  /** Wrong guesses made before the answer (or before time ran out). */
  misses?: string[];
  /** Running total after this turn. */
  total: number;
}

export interface FlightResult {
  dateKey: string;
  sortie: number;
  turns: Turn[];
  points: number;
  finishedAt: number;
}
