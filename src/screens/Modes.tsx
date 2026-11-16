import bank from '../data/prompts.json';
import packsData from '../data/packs.json';
import { PROMPTS_PER_FLIGHT } from '../game/config';
import { dailyPrompts, dateKey, previousDateKey, randomPrompts, shuffle, sortieNumber } from '../game/daily';
import { feet, isAirborne } from '../game/flight';
import { JETS, PAINTS, isUnlocked, nextUnlock } from '../game/hangar';
import type { Pack, Session } from '../game/session';
import type { Save } from '../game/storage';
import type { Prompt } from '../game/types';
import { LAUNCH_DATE } from '../game/config';
import { JetScene } from '../components/JetScene';
import { TierSquares } from '../components/bits';
import { useEffect, useState } from 'react';
import { freePoolNow, loadFreePool } from '../game/freeBank';

const PROMPTS = bank as Prompt[];
const BY_ID = new Map(PROMPTS.map((p) => [p.id, p]));
export const PACKS = packsData as Pack[];

const alt = (points: number) => (isAirborne(points) ? `${feet(points).toLocaleString('en-US')} ft` : 'Runway');
const byIds = (ids: string[]) => ids.map((id) => BY_ID.get(id)).filter((p): p is Prompt => !!p);

function Page({ title, intro, children, onBack }: { title: string; intro: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="screen page">
      <h1 className="page-title">{title}</h1>
      <p className="muted">{intro}</p>
      {children}
      <button className="btn btn-ghost btn-wide" onClick={onBack}>
        Back to the airbase
      </button>
    </div>
  );
}

export function newClassic(pool: Prompt[] = freePoolNow()): Session {
  return { kind: 'classic', title: 'Free Flight · Classic', shareTitle: 'Free Flight', prompts: randomPrompts(pool) };
}

export function newEndurance(pool: Prompt[] = freePoolNow()): Session {
  // two shuffled passes through the whole pool is far more than anyone survives
  const prompts = [...shuffle(pool, Math.random), ...shuffle(pool, Math.random)];
  return { kind: 'endurance', title: 'Free Flight · Endurance', shareTitle: 'Endurance', prompts, maxStalls: 3, endless: true };
}

export function packSession(pack: Pack): Session {
  return { kind: 'pack', key: pack.id, title: `Mission Pack · ${pack.name}`, shareTitle: `${pack.name} pack`, prompts: shuffle(byIds(pack.prompts), Math.random) };
}

export function FreeFlight({ save, onStart, onBack }: { save: Save; onStart: (s: Session) => void; onBack: () => void }) {
  const [pool, setPool] = useState<Prompt[] | null>(null);
  useEffect(() => {
    let live = true;
    loadFreePool().then((p) => live && setPool(p));
    return () => {
      live = false;
    };
  }, []);
  const ready = !!pool;
  return (
    <Page
      title="Free Flight"
      intro={`Unlimited flying from a bank of ${pool ? pool.length : '…'} prompts. Doesn't touch your daily streak, but every point still counts as flight hours.`}
      onBack={onBack}
    >
      <div className="mode-grid">
        <div className="panel mode-card">
          <span className="eyebrow">Classic</span>
          <h2>7 random prompts</h2>
          <p className="muted">The daily format, any time you like. Max 60,000 ft.</p>
          <p className="mode-best">Best: {save.records.classic ? alt(save.records.classic) : '—'}</p>
          <button className="btn btn-primary btn-wide" disabled={!ready} onClick={() => pool && onStart(newClassic(pool))}>
            {ready ? 'Take off' : 'Loading prompts…'}
          </button>
        </div>
        <div className="panel mode-card">
          <span className="eyebrow">Endurance</span>
          <h2>Until 3 Stalls</h2>
          <p className="muted">Prompts keep coming until you run out of time three times. No altitude cap.</p>
          <p className="mode-best">Best: {save.records.endurance ? alt(save.records.endurance) : '—'}</p>
          <button className="btn btn-primary btn-wide" disabled={!ready} onClick={() => pool && onStart(newEndurance(pool))}>
            {ready ? 'Take off' : 'Loading prompts…'}
          </button>
        </div>
      </div>
    </Page>
  );
}

export function FlightLog({ save, onStart, onBack }: { save: Save; onStart: (s: Session) => void; onBack: () => void }) {
  const days: string[] = [];
  for (let d = previousDateKey(dateKey()); d >= LAUNCH_DATE; d = previousDateKey(d)) days.push(d);

  const promptsFor = (d: string): Prompt[] => {
    const flown = save.history[d];
    if (flown) return byIds(flown.turns.map((t) => t.promptId));
    const picked = save.dailyPicks.find((x) => x.dateKey === d);
    if (picked) return byIds(picked.ids);
    return dailyPrompts(PROMPTS, d);
  };

  return (
    <Page title="Flight Log" intro="Replay any past sortie. Replays don't affect your streak or your daily record." onBack={onBack}>
      {days.length === 0 && <p className="muted">No past sorties yet — come back tomorrow.</p>}
      <ul className="log">
        {days.map((d) => {
          const flown = save.history[d];
          const best = save.records.archive[d];
          const label = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
          return (
            <li key={d} className="panel log-row">
              <div className="log-head">
                <b>Sortie #{sortieNumber(d)}</b>
                <span className="muted">{label}</span>
              </div>
              <div className="log-body">
                {flown ? (
                  <>
                    <span>{alt(flown.points)}</span>
                    <TierSquares turns={flown.turns} />
                  </>
                ) : (
                  <span className="muted">Missed</span>
                )}
                {best != null && <span className="muted small">Replay best: {alt(best)}</span>}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  onStart({ kind: 'archive', key: d, title: `Flight Log · Sortie #${sortieNumber(d)}`, shareTitle: `Sortie #${sortieNumber(d)} (replay)`, prompts: promptsFor(d).slice(0, PROMPTS_PER_FLIGHT) })
                }
              >
                {flown || best != null ? 'Replay' : 'Fly'}
              </button>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

export function MissionPacks({ save, onStart, onBack }: { save: Save; onStart: (s: Session) => void; onBack: () => void }) {
  return (
    <Page title="Mission Packs" intro="Themed sets of seven prompts. Fly them as often as you like." onBack={onBack}>
      <div className="mode-grid">
        {PACKS.map((p) => {
          const best = save.records.packs[p.id];
          return (
            <div key={p.id} className="panel mode-card">
              <span className="eyebrow">{p.prompts.length} prompts</span>
              <h2>{p.name}</h2>
              <p className="muted">{p.blurb}</p>
              <p className="mode-best">Best: {best ? alt(best) : '—'}</p>
              <button className="btn btn-primary btn-wide" onClick={() => onStart(packSession(p))}>
                Fly pack
              </button>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

export function Hangar({ save, onSelect, onBack }: { save: Save; onSelect: (patch: { selectedJet?: string; selectedPaint?: string }) => void; onBack: () => void }) {
  const hours = save.flightHours;
  const next = nextUnlock(hours);
  const prevAt = Math.max(0, ...[...JETS, ...PAINTS].map((i) => i.unlockAtFlightHours).filter((h) => h <= hours));
  const progress = next ? (hours - prevAt) / (next.at - prevAt) : 1;

  return (
    <Page title="Hangar" intro="Pick your jet and paint. Cards show the factory finish; your paint is applied in flight. Fly more to unlock the rest — it's all cosmetic." onBack={onBack}>
      <JetScene points={140} hud={false} banners={false} className="hangar-scene" />
      <div className="panel career">
        <div className="career-head">
          <span className="eyebrow">Career</span>
          <span>
            <b>{hours.toLocaleString('en-US')}</b> flight hours
          </span>
        </div>
        <div className="career-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <p className="muted small">{next ? `Next: ${next.name} at ${next.at.toLocaleString('en-US')} h` : 'Everything unlocked. Show-off.'}</p>
      </div>

      <span className="eyebrow">Jets</span>
      <div className="jet-grid">
        {JETS.map((j) => {
          const open = isUnlocked(j, hours);
          const on = save.selectedJet === j.id;
          return (
            <button key={j.id} className={`panel jet-card ${on ? 'selected' : ''}`} disabled={!open} aria-pressed={on} onClick={() => onSelect({ selectedJet: j.id })}>
              <img className={`jet-art ${open ? '' : 'jet-art-locked'}`} src={j.image} alt="" width={320} height={215} />
              <b>{j.name}</b>
              <span className="muted small">{open ? j.blurb : `🔒 ${j.unlockAtFlightHours.toLocaleString('en-US')} flight hours`}</span>
            </button>
          );
        })}
      </div>

      <span className="eyebrow">Paint</span>
      <div className="paint-grid">
        {PAINTS.map((p) => {
          const open = isUnlocked(p, hours);
          const on = save.selectedPaint === p.id;
          return (
            <button
              key={p.id}
              className={`paint ${on ? 'selected' : ''}`}
              disabled={!open}
              aria-pressed={on}
              aria-label={open ? p.name : `${p.name}, locked until ${p.unlockAtFlightHours} flight hours`}
              onClick={() => onSelect({ selectedPaint: p.id })}
            >
              <span className="swatch" style={{ background: `linear-gradient(135deg, ${p.body} 60%, ${p.accent} 60%)` }}>
                {!open && '🔒'}
              </span>
              <span className="small">{open ? p.name : `${p.unlockAtFlightHours} h`}</span>
            </button>
          );
        })}
      </div>
    </Page>
  );
}
