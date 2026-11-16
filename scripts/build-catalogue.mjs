// Writes docs/answer-bank.md: every prompt, every accepted answer, grouped by tier,
// with what each tier does to the jet. Run `npm run catalogue`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const daily = read('prompts.json');
const free = read('free-prompts.json');

const TIERS = [
  ['sonic', 'Sonic Boom', 100, 'Afterburner, shockwave ring, screen shake'],
  ['stealth', 'Stealth', 85, 'Very strong burn, vapour trail'],
  ['ace', 'Ace', 60, 'Strong burn'],
  ['wingman', 'Wingman', 30, 'Steady acceleration'],
  ['showboat', 'Showboat', 15, 'Small thrust; the tower is unimpressed'],
  ['rookie', 'Rookie', 10, 'Small puff of thrust'],
];

const fmt = (a) => (a.aliases.length ? `${a.text} _(also: ${a.aliases.join(', ')})_` : a.text);

function section(title, prompts) {
  const byCat = new Map();
  for (const p of prompts) byCat.set(p.category, [...(byCat.get(p.category) ?? []), p]);
  let out = `\n## ${title} — ${prompts.length} prompts\n`;
  for (const [cat, ps] of [...byCat].sort((a, b) => a[0].localeCompare(b[0]))) {
    out += `\n### ${cat}\n`;
    for (const p of ps) {
      out += `\n#### ${p.text}  \`${p.id}\` · ${p.answers.length} answers\n\n`;
      for (const [id, name, pts] of TIERS) {
        const list = p.answers.filter((a) => a.tier === id);
        if (list.length) out += `- **${name} (${pts})** — ${list.map(fmt).join('; ')}\n`;
      }
      out += `- **Stall (0)** — anything else: the player is told it's not correct and can retry until the 25 s clock runs out.\n`;
    }
  }
  return out;
}

const total = [...daily, ...free].reduce((n, p) => n + p.answers.length, 0);
let md = `# Mach 7 — answer bank\n\nGenerated from \`data/prompts.txt\` and \`data/free-prompts.txt\`. ${daily.length + free.length} prompts, ${total} accepted answers.\n\n`;
md += `## What each tier does\n\n| Tier | Points | What the jet does |\n|---|---|---|\n`;
for (const [, name, pts, fx] of TIERS) md += `| ${name} | ${pts} | ${fx} |\n`;
md += `| Stall | 0 | Engine sputters, jet wobbles (only when time runs out — wrong answers can be retried) |\n\n`;
md += `Two Ace-or-better answers in a row light the afterburner; from the third in a row each answer gets +10.\n`;
md += `Matching ignores capitals, accents, punctuation and a leading "the"; one typo is allowed in 5–8 letter answers, two in 9+.\n`;
md += section('Daily Sortie & Mission Packs bank', daily);
md += section('Free Flight & Endurance bank', free);

mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/answer-bank.md', import.meta.url), md);
console.log(`docs/answer-bank.md: ${daily.length + free.length} prompts, ${total} answers, ${(md.length / 1024).toFixed(0)} KB`);
