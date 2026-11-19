import { describe, expect, it } from 'vitest';
import bank from '../data/prompts.json';
import { dailyPrompts, formatCountdown, msToNextSortie, sortieNumber } from './daily';
import { feet, knots, rankFor, readout, scoreTurn, zoneFor } from './flight';
import { shareText } from './share';
import { liveStreak, load, recordDaily, type Save } from './storage';
import type { FlightResult, Prompt, TierId, Turn } from './types';

function play(tiers: TierId[]): Turn[] {
  const turns: Turn[] = [];
  for (const t of tiers) turns.push(scoreTurn(turns, 'p', 'x', 'x', t));
  return turns;
}

describe('flight maths', () => {
  it('ground speed then altitude', () => {
    expect(knots(0)).toBe(0);
    expect(knots(58)).toBe(87);
    expect(readout(58)).toBe('087 KT');
    expect(feet(100)).toBe(0);
    expect(readout(345)).toBe('24,500 FT');
    expect(feet(700)).toBe(60000);
  });
  it('zones', () => {
    expect(zoneFor(0).id).toBe('taxiway');
    expect(zoneFor(20).id).toBe('roll');
    expect(zoneFor(99).id).toBe('roll');
    expect(zoneFor(100).id).toBe('climb');
    expect(zoneFor(400).id).toBe('strato');
    expect(zoneFor(650).id).toBe('space');
  });
  it('ranks', () => {
    expect(rankFor(99).name).toBe('Grounded');
    expect(rankFor(100).name).toBe('Cadet');
    expect(rankFor(450).name).toBe('Squadron Leader');
    expect(rankFor(700).name).toBe('Top Ace');
  });
});

describe('afterburner streak', () => {
  it('no bonus for two Ace+ in a row', () => {
    expect(play(['ace', 'stealth']).at(-1)!.total).toBe(145);
  });
  it('+10 from the third Ace+ in a row', () => {
    const t = play(['ace', 'ace', 'sonic', 'stealth', 'wingman', 'ace']);
    expect(t.map((x) => x.bonus)).toEqual([0, 0, 10, 10, 0, 0]);
    expect(t.at(-1)!.total).toBe(60 + 60 + 110 + 95 + 30 + 60);
  });
  it('stall adds nothing and breaks the streak', () => {
    const t = play(['ace', 'ace', 'stall', 'ace']);
    expect(t.map((x) => x.total)).toEqual([60, 120, 120, 180]);
  });
});

describe('daily seeding', () => {
  const prompts = bank as Prompt[];
  it('same date, same 7 prompts', () => {
    const a = dailyPrompts(prompts, '2026-11-13').map((p) => p.id);
    expect(a).toHaveLength(7);
    expect(new Set(a).size).toBe(7);
    expect(dailyPrompts(prompts.slice().reverse(), '2026-11-13').map((p) => p.id)).toEqual(a);
  });
  it('different dates differ', () => {
    expect(dailyPrompts(prompts, '2026-11-13').map((p) => p.id)).not.toEqual(
      dailyPrompts(prompts, '2026-11-14').map((p) => p.id),
    );
  });
  it('sortie numbers and countdown', () => {
    expect(sortieNumber('2026-11-01')).toBe(1);
    expect(sortieNumber('2026-11-13')).toBe(13);
    expect(msToNextSortie(new Date('2026-11-13T23:59:00Z'))).toBe(60_000);
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
  });
});

describe('streaks and share', () => {
  const result = (dateKey: string, points = 150): FlightResult => ({
    dateKey,
    sortie: sortieNumber(dateKey),
    turns: play(['ace', 'stall', 'rookie', 'wingman', 'stealth', 'sonic', 'showboat']),
    points,
    finishedAt: 0,
  });
  it('consecutive days extend the streak, a gap resets it', () => {
    let s: Save = load();
    s = recordDaily(s, result('2026-11-10'));
    s = recordDaily(s, result('2026-11-11'));
    expect(s.sortieStreak).toBe(2);
    expect(liveStreak(s, '2026-11-12')).toBe(2);
    expect(liveStreak(s, '2026-11-13')).toBe(0);
    s = recordDaily(s, result('2026-11-13'));
    expect(s.sortieStreak).toBe(1);
    expect(s.bestStreak).toBe(2);
    expect(s.flightHours).toBe(450);
  });
  it('replaying the same day is ignored', () => {
    const s = recordDaily(recordDaily(load(), result('2026-11-10')), result('2026-11-10', 999));
    expect(s.flightHours).toBe(150);
  });
  it('share text is spoiler-free', () => {
    const r = result('2026-11-13', 515);
    expect(shareText(r)).toBe('Raredar Sortie #13 ✈️ 41,500 ft — Wing Commander\n🟩⬛⬜🟦🟪🟨🟧\nhttps://raredar.io');
    expect(shareText({ ...r, points: 60 })).toContain('Never left the runway — Grounded');
  });
});

import { randomPrompts } from './daily';
import { withDailyPicks } from './storage';

describe('random daily prompts', () => {
  const prompts = bank as Prompt[];
  it('picks 7 unique prompts from different categories', () => {
    for (let i = 0; i < 20; i++) {
      const p = randomPrompts(prompts);
      expect(new Set(p.map((x) => x.id)).size).toBe(7);
      expect(new Set(p.map((x) => x.category)).size).toBe(7);
    }
  });
  it('avoids recently seen prompts while enough remain', () => {
    const recent = new Set(prompts.slice(0, 40).map((p) => p.id));
    const p = randomPrompts(prompts, recent);
    expect(p).toHaveLength(7);
    expect(p.filter((x) => recent.has(x.id)).length).toBeLessThanOrEqual(Math.max(0, 7 - (prompts.length - 40)));
  });
  it('picks once per day and keeps the pick', () => {
    let calls = 0;
    const pick = () => (calls++, ['a', 'b']);
    let s = withDailyPicks(load(), '2026-11-14', pick, 6);
    s = withDailyPicks(s, '2026-11-14', pick, 6);
    expect(calls).toBe(1);
    expect(s.dailyPicks.at(-1)).toEqual({ dateKey: '2026-11-14', ids: ['a', 'b'] });
  });
});
