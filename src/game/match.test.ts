import { describe, expect, it } from 'vitest';
import bank from '../data/prompts.json';
import { allowedDistance, levenshtein, matchAnswer, normalize } from './match';
import type { Prompt } from './types';

const prompts = bank as Prompt[];
const byId = (id: string) => prompts.find((p) => p.id === id)!;

const mini: Prompt = {
  id: 'mini',
  text: 'Name a country in Africa.',
  category: 'Test',
  answers: [
    { text: 'Egypt', aliases: [], tier: 'rookie' },
    { text: 'Gambia', aliases: [], tier: 'ace' },
    { text: 'Zambia', aliases: [], tier: 'ace' },
    { text: 'Ivory Coast', aliases: ["Côte d'Ivoire"], tier: 'ace' },
    { text: 'Mali', aliases: [], tier: 'ace' },
    { text: 'São Tomé and Príncipe', aliases: ['Sao Tome'], tier: 'sonic' },
    { text: 'Central African Republic', aliases: ['CAR'], tier: 'stealth' },
    { text: 'Equatorial Guinea', aliases: [], tier: 'stealth' },
  ],
};
const m = (s: string) => matchAnswer(mini, s)?.text ?? null;

describe('normalize', () => {
  it('lowercases, trims and collapses spaces', () => expect(normalize('  EGYPT   now ')).toBe('egypt now'));
  it('strips accents', () => expect(normalize('Côte d’Ivoire')).toBe('cote divoire'));
  it('strips punctuation', () => expect(normalize('Dr. No!')).toBe('dr no'));
  it('drops a leading "the"', () => expect(normalize('The Gambia')).toBe('gambia'));
  it('keeps "the" elsewhere', () => expect(normalize('Theremin')).toBe('theremin'));
  it('turns & into and', () => expect(normalize('G&T')).toBe('g and t'));
});

describe('levenshtein', () => {
  it('counts edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('same', 'same')).toBe(0);
  });
  it('typo allowance follows word length', () => {
    expect(allowedDistance(4)).toBe(0);
    expect(allowedDistance(5)).toBe(1);
    expect(allowedDistance(8)).toBe(1);
    expect(allowedDistance(9)).toBe(2);
  });
});

describe('matchAnswer', () => {
  it('matches exact text, case and spacing-insensitive', () => expect(m('  egypt ')).toBe('Egypt'));
  it('matches aliases', () => expect(m('cote d ivoire')).toBe('Ivory Coast'));
  it('matches aliases without accents', () => expect(m('sao tome and principe')).toBe('São Tomé and Príncipe'));
  it('ignores spacing differences', () => expect(m('ivorycoast')).toBe('Ivory Coast'));
  it('drops leading "the"', () => expect(m('The Gambia')).toBe('Gambia'));
  it('prefers exact over fuzzy (Gambia vs Zambia)', () => {
    expect(m('Zambia')).toBe('Zambia');
    expect(m('Gambia')).toBe('Gambia');
  });
  it('allows 1 typo at 5+ letters', () => expect(m('Egpyt')).toBe(null)); // transposition = 2 edits
  it('allows 1 substitution at 5+ letters', () => expect(m('Egypf')).toBe('Egypt'));
  it('allows no typos under 5 letters', () => expect(m('Mala')).toBe(null));
  it('allows 2 typos at 9+ letters', () => expect(m('equatorial gunea')).toBe('Equatorial Guinea'));
  it('rejects 3 typos at 9+ letters', () => expect(m('ekwatorial gunea')).toBe(null));
  it('rejects 2 typos under 9 letters', () => expect(m('Ejipt')).toBe(null));
  it('rejects empty and junk', () => {
    expect(m('')).toBe(null);
    expect(m('   ')).toBe(null);
    expect(m('!!!')).toBe(null);
  });
  it('rejects answers not in the bank', () => expect(m('France')).toBe(null));
  it('short aliases need an exact match', () => {
    expect(m('car')).toBe('Central African Republic');
    expect(m('cat')).toBe(null);
  });
});

describe('real prompt bank', () => {
  it('has 50+ prompts with 25+ answers each and every tier', () => {
    expect(prompts.length).toBeGreaterThanOrEqual(50);
    for (const p of prompts) {
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(25);
      expect(new Set(p.answers.map((a) => a.tier)).size, p.id).toBe(6);
    }
  });
  it('every answer and alias matches itself', () => {
    for (const p of prompts)
      for (const a of p.answers)
        for (const f of [a.text, ...a.aliases]) expect(matchAnswer(p, f)?.text, `${p.id}: ${f}`).toBe(a.text);
  });
  it('handles real-world inputs', () => {
    expect(matchAnswer(byId('africa'), 'DRC')?.tier).toBe('wingman');
    expect(matchAnswer(byId('bond'), 'Dr No')?.text).toBe('Dr. No');
    expect(matchAnswer(byId('cocktail'), 'aviation')?.tier).toBe('sonic');
    expect(matchAnswer(byId('shakespeare'), 'richard 3')?.text).toBe('Richard III');
    expect(matchAnswer(byId('pixar'), 'walle')?.text).toBe('WALL-E');
    expect(matchAnswer(byId('pixar'), 'cars 3')?.text).toBe('Cars 3');
    expect(matchAnswer(byId('dinosaur'), 't rex')?.tier).toBe('rookie');
    expect(matchAnswer(byId('dinosaur'), 'pterodactyl')).toBe(null);
  });
});

import freeBank from '../data/free-prompts.json';
import { randomPrompts } from './daily';

describe('free flight bank', () => {
  const free = freeBank as Prompt[];
  it('has 200 prompts, 25+ answers each, every tier', () => {
    expect(free.length).toBeGreaterThanOrEqual(200);
    for (const p of free) {
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(25);
      expect(new Set(p.answers.map((a) => a.tier)).size, p.id).toBe(6);
    }
  });
  it('every answer and alias matches itself', () => {
    for (const p of free)
      for (const a of p.answers)
        for (const f of [a.text, ...a.aliases]) expect(matchAnswer(p, f)?.text, `${p.id}: ${f}`).toBe(a.text);
  });
  it('handles + and # in answers', () => {
    const p = free.find((x) => x.id === 'proglang')!;
    expect(matchAnswer(p, 'c++')?.text).toBe('C++');
    expect(matchAnswer(p, 'C#')?.text).toBe('C#');
    expect(matchAnswer(p, 'c')?.text).toBe('C');
  });
  it('a combined pool still gives 7 prompts from 7 different categories', () => {
    const pool = [...prompts, ...free];
    for (let i = 0; i < 20; i++) expect(new Set(randomPrompts(pool).map((p) => p.category)).size).toBe(7);
  });
});
