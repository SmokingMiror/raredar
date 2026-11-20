# Raredar

A daily "rarest answer wins" trivia game with fighter jets. Seven prompts, 25 seconds each — obvious answers barely move your jet down the runway, rare ones light the afterburner and launch you towards the edge of space.

## Play

```bash
npm install
npm run dev
```

## Modes

- **Daily Sortie** — 7 random prompts a day, one flight, streaks and medals
- **Free Flight** — Classic (7 random prompts) or Endurance (until 3 stalls), from a 256-prompt bank
- **Flight Log** — replay past sorties
- **Mission Packs** — 7 themed packs
- **Hangar** — 6 pixel-art fighter jets (F-16, F/A-18, F-15, Typhoon, F-35 and F-22 styles) and 8 paint schemes, unlocked with flight hours

## Scoring

| Tier | Points | Jet |
|---|---|---|
| Rookie | 10 | Small puff of thrust |
| Showboat | 15 | Small thrust, tower unimpressed |
| Wingman | 30 | Steady acceleration |
| Ace | 60 | Strong burn |
| Stealth | 85 | Vapour trail |
| Sonic Boom | 100 | Afterburner + shockwave |
| Stall | 0 | Only when time runs out — wrong answers can be retried |

The first 100 points are the runway; every point after that is 100 ft of altitude (max 60,000 ft, more with the afterburner bonus).

## Prompt banks

- `data/prompts.txt` — daily bank (51 prompts)
- `data/free-prompts.txt` — Free Flight bank (205 prompts)
- `docs/answer-bank.md` — readable catalogue of every prompt and answer by tier

After editing a bank:

```bash
npm run prompts && npm run catalogue
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Run the unit tests |
| `npm run prompts` | Compile and validate the prompt banks |
| `npm run catalogue` | Regenerate `docs/answer-bank.md` |

Built with Vite, React and TypeScript. Sound is synthesised with Web Audio; progress is stored in the browser.

## Credits

Five Free Flight prompts (potatoes, four-letter animals, NBA MVPs, stations, superhero teams) are adapted from the sample bank of [OpenKrillion](https://github.com/VulcanEon/openkrillion.com-service), MIT licence, © 2026 OpenKrillion contributors.

Pixel fonts: [VT323](https://fonts.google.com/specimen/VT323) by Peter Hull (SIL Open Font License, bundled in `public/fonts`) and [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (SIL Open Font License, via Google Fonts).
