import { TIERS, TIER_ORDER } from '../game/config';
import { MEDALS, earnedMedals, serviceStats } from '../game/stats';
import type { Save } from '../game/storage';
import { useSettings, useTierColor, type Settings } from '../settings';
import { audio } from '../audio';
import { TierMedal } from '../components/bits';

function Page({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="screen page">
      <h1 className="page-title">{title}</h1>
      {children}
      <button className="btn btn-ghost btn-wide" onClick={onBack}>
        Back to the airbase
      </button>
    </div>
  );
}

export function MedalIcon({ earned }: { earned: boolean }) {
  return (
    <svg viewBox="0 0 40 48" width="34" height="40" aria-hidden="true">
      <path d="M12 0h6l4 14h-6zM28 0h-6l-4 14h6z" fill={earned ? '#3b82c4' : '#2a3242'} />
      <circle cx="20" cy="30" r="14" fill={earned ? '#ffe08a' : '#1a2130'} stroke={earned ? '#fff6d6' : '#3a4252'} strokeWidth="2" />
      <path d="M20 22l2.4 5 5.4.6-4 3.7 1.1 5.3L20 34l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" fill={earned ? '#b8860b' : '#3a4252'} />
    </svg>
  );
}

export function ServiceRecord({ save, streak, onBack }: { save: Save; streak: number; onBack: () => void }) {
  const s = serviceStats(save.history);
  const earned = new Set(earnedMedals(save));
  const color = useTierColor();
  const maxCount = Math.max(1, ...Object.values(s.tierCounts));
  const tiles: [string, string][] = [
    [String(s.sorties), 'sorties flown'],
    [s.sorties ? `${s.averageFeet.toLocaleString('en-US')}` : '—', 'average altitude (ft)'],
    [s.bestFeet ? s.bestFeet.toLocaleString('en-US') : '—', 'best altitude (ft)'],
    [s.sorties ? `${Math.round(s.takeoffRate * 100)}%` : '—', 'take-off rate'],
    [String(streak), 'current streak'],
    [String(save.bestStreak), 'best streak'],
  ];

  return (
    <Page title="Service Record" onBack={onBack}>
      <div className="record-grid">
        {tiles.map(([v, l]) => (
          <div key={l}>
            <b>{v}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <p className="muted">
        <b className="hours">{save.flightHours.toLocaleString('en-US')}</b> lifetime flight hours
      </p>

      <div className="panel">
        <span className="eyebrow">Answer tiers · {s.answers} answers</span>
        <div className="dist" role="list">
          {TIER_ORDER.map((t) => (
            <div key={t} className="dist-row" role="listitem" aria-label={`${TIERS[t].name}: ${s.tierCounts[t]}`}>
              <span className="dist-name" style={{ color: color(t) }}>
                <TierMedal tier={t} size={20} />
                {TIERS[t].name}
              </span>
              <span className="dist-bar">
                <span style={{ width: `${(s.tierCounts[t] / maxCount) * 100}%`, background: color(t) }} />
              </span>
              <span className="dist-n">{s.tierCounts[t]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <span className="eyebrow">
          Medals · {earned.size}/{MEDALS.length}
        </span>
        <ul className="medals">
          {MEDALS.map((m) => (
            <li key={m.id} className={earned.has(m.id) ? 'earned' : ''}>
              <MedalIcon earned={earned.has(m.id)} />
              <div>
                <b>{m.name}</b>
                <span>{m.desc}</span>
              </div>
              <span className="sr-only">{earned.has(m.id) ? 'Earned' : 'Not yet earned'}</span>
            </li>
          ))}
        </ul>
      </div>
    </Page>
  );
}

const TOGGLES: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'sound', label: 'Sound effects', hint: 'Engine, radio crackle, sonic boom' },
  { key: 'music', label: 'Music', hint: 'A music layer for each flight zone' },
  { key: 'reducedMotion', label: 'Reduced motion', hint: 'No screen shake or shockwaves; simple fades. Also follows your system setting.' },
  { key: 'colorBlind', label: 'Colour-blind palette', hint: 'Tier colours that stay distinct, plus a letter on each tier square' },
];

export function SettingsPage({ onBack, onReset }: { onBack: () => void; onReset: () => void }) {
  const { settings, update } = useSettings();
  const color = useTierColor();
  return (
    <Page title="Settings" onBack={onBack}>
      <div className="panel settings">
        {TOGGLES.map((t) => (
          <label key={t.key} className="toggle">
            <span>
              <b>{t.label}</b>
              <small>{t.hint}</small>
            </span>
            <input type="checkbox" role="switch" aria-label={t.label} aria-description={t.hint} checked={settings[t.key]} onChange={(e) => {
                audio.unlock();
                update({ [t.key]: e.target.checked });
              }} />
            <i aria-hidden="true" />
          </label>
        ))}
        <p className="muted small">Sound is off on a first visit. The speaker button in the corner mutes everything at any time.</p>
      </div>
      <div className="panel">
        <span className="eyebrow">Tier palette preview</span>
        <div className="palette">
          {TIER_ORDER.map((t) => (
            <span key={t} style={{ borderColor: color(t), color: color(t) }}>
              {TIERS[t].name}
            </span>
          ))}
        </div>
      </div>
      <button
        className="btn btn-ghost btn-wide danger"
        onClick={() => {
          if (confirm('Wipe all progress on this device? Streaks, history and medals will be lost.')) onReset();
        }}
      >
        Reset all progress
      </button>
    </Page>
  );
}

const FAQ: [string, string][] = [
  ['How are answers scored?', 'Every prompt has a hand-made list of accepted answers, and each one is graded from Rookie (the answer everyone gives) to Sonic Boom (one or two gems per prompt). Rarer answers give more thrust.'],
  ['What happens if my answer is wrong?', 'You are told it is not correct and can try again as many times as you like while the 25-second clock runs. Only running out of time is a Stall.'],
  ['What happens to a misspelling?', 'Small typos are forgiven: one wrong letter in words of 5–8 letters, two in words of 9 or more. Capitals, accents, punctuation and a leading “the” are ignored.'],
  ['My answer is right but it Stalled!', 'The lists are curated, so some valid answers will be missing. Your wrong tries are listed on the reveal screen — tap “Suggest” next to one and it is logged for review.'],
  ['When does the sortie reset?', 'At 00:00 UTC. Each day you get seven prompts picked at random from the whole bank, avoiding ones you have seen recently.'],
  ['How does the streak work?', 'Fly the daily sortie on consecutive days. Miss a day and it starts again. Medals at 7, 30 and 100 sorties.'],
  ['What is the afterburner?', 'Two Ace-or-better answers in a row light it. From the third in a row, each answer earns a +10 bonus while the streak lasts.'],
  ['What if I refresh mid-flight?', 'Your answers and the running clock are saved, so you carry on where you left off — the timer does not reset.'],
  ['Where is my data kept?', 'Only in this browser, on this device. There are no accounts yet. Clearing site data, or Reset in Settings, wipes it.'],
];

export function FaqPage({ onBack }: { onBack: () => void }) {
  return (
    <Page title="FAQ" onBack={onBack}>
      <div className="faq">
        {FAQ.map(([q, a]) => (
          <details key={q} className="panel">
            <summary>{q}</summary>
            <p className="muted">{a}</p>
          </details>
        ))}
      </div>
    </Page>
  );
}
