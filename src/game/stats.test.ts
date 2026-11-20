import { describe, expect, it } from 'vitest';
import { scoreTurn } from './flight';
import { earnedMedals, newMedals, serviceStats } from './stats';
import type { FlightResult, TierId, Turn } from './types';

function flight(dateKey: string, tiers: TierId[]): FlightResult {
  const turns: Turn[] = [];
  for (const t of tiers) turns.push(scoreTurn(turns, 'p', 'x', 'x', t));
  return { dateKey, sortie: 1, turns, points: turns.at(-1)!.total, finishedAt: 0 };
}

const grounded = flight('2026-11-01', ['rookie', 'stall', 'rookie', 'stall', 'rookie', 'stall', 'rookie']); // 40
const high = flight('2026-11-02', ['sonic', 'stealth', 'ace', 'ace', 'wingman', 'ace', 'wingman']); // 100+85+70+70+30+60+30 = 445

describe('service record', () => {
  it('is empty with no history', () => {
    const s = serviceStats({});
    expect(s.sorties).toBe(0);
    expect(s.takeoffRate).toBe(0);
    expect(s.bestFeet).toBe(0);
  });
  it('averages altitude, counts take-offs and tiers', () => {
    const s = serviceStats({ a: grounded, b: high });
    expect(high.points).toBe(445);
    expect(s.sorties).toBe(2);
    expect(s.bestFeet).toBe(34500);
    expect(s.averageFeet).toBe(17250);
    expect(s.takeoffRate).toBe(0.5);
    expect(s.tierCounts.rookie).toBe(4);
    expect(s.tierCounts.ace).toBe(3);
    expect(s.answers).toBe(14);
  });
});

describe('medals', () => {
  it('awards flight medals', () => {
    expect(earnedMedals({ bestStreak: 1, history: { a: grounded } })).toEqual([]);
    expect(earnedMedals({ bestStreak: 1, history: { b: high } })).toEqual(['wheels-up', 'boom', 'clean', 'strato']);
  });
  it('awards streak medals at 7, 30 and 100', () => {
    expect(earnedMedals({ bestStreak: 30, history: {} })).toEqual(['streak-7', 'streak-30']);
  });
  it('reports only newly earned medals', () => {
    const before = { bestStreak: 1, history: { a: grounded } };
    const after = { bestStreak: 2, history: { a: grounded, b: high } };
    expect(newMedals(before, after).map((m) => m.id)).toEqual(['wheels-up', 'boom', 'clean', 'strato']);
    expect(newMedals(after, after)).toEqual([]);
  });
});

import bank from '../data/prompts.json';
import packs from '../data/packs.json';
import { newUnlocks, nextUnlock } from './hangar';
import { load, recordFree } from './storage';

describe('mission packs and hangar', () => {
  it('every pack prompt exists in the bank, 7 per pack', () => {
    const ids = new Set((bank as { id: string }[]).map((p) => p.id));
    for (const p of packs) {
      expect(p.prompts, p.id).toHaveLength(7);
      for (const id of p.prompts) expect(ids.has(id), `${p.id}: ${id}`).toBe(true);
    }
  });
  it('reports unlocks when crossing thresholds', () => {
    expect(newUnlocks(0, 299)).toEqual([]);
    expect(newUnlocks(250, 520)).toEqual(['Mantis (jet)', 'Aggressor paint']);
    expect(nextUnlock(0)).toEqual({ name: 'Aggressor', at: 300 });
  });
  it('free flights add hours and records but not streaks', () => {
    let s = recordFree(load(), 'endurance', 820);
    s = recordFree(s, 'pack', 300, 'atlas');
    s = recordFree(s, 'pack', 200, 'atlas');
    expect(s.flightHours).toBe(1320);
    expect(s.records.endurance).toBe(820);
    expect(s.records.packs.atlas).toBe(300);
    expect(s.sortieStreak).toBe(0);
  });
});
