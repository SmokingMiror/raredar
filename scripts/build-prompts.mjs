// Compiles the prompt banks and checks them for problems:
//   data/prompts.txt       -> src/data/prompts.json       (Daily Sortie + Mission Packs)
//   data/free-prompts.txt  -> src/data/free-prompts.json  (Free Flight / Endurance only)
import { readFileSync, writeFileSync } from 'node:fs';

const TIERS = { R: 'rookie', S: 'showboat', W: 'wingman', A: 'ace', X: 'stealth', B: 'sonic' };

const key = (s) => {
  let n = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/\+/g, ' plus ').replace(/#/g, ' sharp ').replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  if (n.startsWith('the ')) n = n.slice(4);
  return n.replace(/ /g, '');
};

function parse(file) {
  const src = readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8');
  const prompts = [];
  let cur = null;
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('@')) {
      const [id, category, text] = line.slice(1).split('|').map((s) => s.trim());
      cur = { id, text, category, answers: [] };
      prompts.push(cur);
      continue;
    }
    const tier = TIERS[line[0]];
    if (!tier || !cur || line[1] !== ' ') throw new Error(`${file}: bad line: ${line.slice(0, 60)}`);
    for (const item of line.slice(2).split(';').map((s) => s.trim()).filter(Boolean)) {
      const [text, ...aliases] = item.split('/').map((s) => s.trim()).filter(Boolean);
      cur.answers.push({ text, aliases, tier });
    }
  }
  return prompts;
}

let problems = 0;
const warn = (msg) => {
  console.warn(msg);
  problems++;
};

function check(prompts, file) {
  for (const p of prompts) {
    const seen = new Map();
    for (const a of p.answers) {
      for (const f of [a.text, ...a.aliases]) {
        const k = key(f);
        if (!k) warn(`[${file}:${p.id}] empty answer form in "${a.text}"`);
        if (seen.has(k) && seen.get(k) !== a.text) warn(`[${file}:${p.id}] "${f}" duplicates "${seen.get(k)}"`);
        seen.set(k, a.text);
      }
    }
    if (p.answers.length < 25) warn(`[${file}:${p.id}] only ${p.answers.length} answers`);
    if (new Set(p.answers.map((a) => a.tier)).size < 6) warn(`[${file}:${p.id}] missing tiers`);
  }
}

const daily = parse('prompts.txt');
const free = parse('free-prompts.txt');
check(daily, 'prompts.txt');
check(free, 'free-prompts.txt');

const ids = new Map();
for (const p of [...daily, ...free]) {
  if (ids.has(p.id)) warn(`duplicate prompt id "${p.id}"`);
  ids.set(p.id, true);
}

writeFileSync(new URL('../src/data/prompts.json', import.meta.url), JSON.stringify(daily, null, 1) + '\n');
// free bank is large, so keep it compact
writeFileSync(new URL('../src/data/free-prompts.json', import.meta.url), JSON.stringify(free) + '\n');

const count = (ps) => ps.reduce((n, p) => n + p.answers.length, 0);
console.log(`daily: ${daily.length} prompts, ${count(daily)} answers`);
console.log(`free:  ${free.length} prompts, ${count(free)} answers`);
console.log(`${problems} problems`);
if (problems) process.exit(1);
