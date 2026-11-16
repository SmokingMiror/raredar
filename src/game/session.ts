import type { FreeKind } from './storage';
import type { Prompt } from './types';

/** A flight in progress in any mode. */
export interface Session {
  kind: 'daily' | FreeKind;
  title: string;
  shareTitle?: string;
  prompts: Prompt[];
  maxStalls?: number;
  endless?: boolean;
  /** Pack id or archive date. */
  key?: string;
}

export interface Pack {
  id: string;
  name: string;
  blurb: string;
  prompts: string[];
}
