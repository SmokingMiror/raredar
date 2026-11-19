import { useEffect, useRef, useState } from 'react';
import { GAME_NAME, TIERS, TIER_ORDER } from '../game/config';
import { useSettings, useTierColor } from '../settings';
import { JetScene } from './JetScene';
import { audio } from '../audio';
import { TierMedal } from './bits';

export function SoundToggle() {
  const { settings, update } = useSettings();
  return (
    <button
      className="icon-btn"
      aria-label={settings.sound ? 'Mute sound' : 'Turn sound on'}
      aria-pressed={settings.sound}
      onClick={() => {
        audio.unlock();
        update({ sound: !settings.sound });
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" fillOpacity="0.2" />
        {settings.sound ? (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        ) : (
          <path d="M16 9l5 6M21 9l-5 6" />
        )}
      </svg>
    </button>
  );
}

export function TopBar({ onMenu, title }: { onMenu: () => void; title?: string }) {
  return (
    <div className="topbar">
      <button id="menu-button" className="icon-btn" aria-label="Open menu" aria-haspopup="dialog" onClick={onMenu}>
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      </button>
      {title && <span className="topbar-title">{title}</span>}
      <SoundToggle />
    </div>
  );
}

export type MenuTarget = 'daily' | 'free' | 'log' | 'packs' | 'hangar' | 'record' | 'settings' | 'faq' | 'briefing';

interface Item {
  label: string;
  code: string;
  target?: MenuTarget;
  tag?: string;
}

const ITEMS: Item[] = [
  { label: 'Daily Sortie', code: 'DLY', target: 'daily' },
  { label: 'Free Flight', code: 'FRE', target: 'free' },
  { label: 'Flight Log', code: 'LOG', target: 'log' },
  { label: 'Mission Packs', code: 'MSN', target: 'packs' },
  { label: 'Hangar', code: 'HGR', target: 'hangar' },
  { label: 'Dogfight', code: 'DGF', tag: 'Phase 2' },
  { label: 'Service Record', code: 'REC', target: 'record' },
  { label: 'Squadron', code: 'SQN', tag: 'Phase 2' },
  { label: 'Settings', code: 'SET', target: 'settings' },
  { label: 'How to play', code: 'BRF', target: 'briefing' },
  { label: 'FAQ', code: 'FAQ', target: 'faq' },
];

export function Menu({ open, onClose, onGo }: { open: boolean; onClose: () => void; onGo: (t: MenuTarget) => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      document.getElementById('menu-button')?.focus();
    };
  }, [open, onClose]);

  return (
    <div className={`menu-root ${open ? 'menu-open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="menu-backdrop" onClick={onClose} />
      <div ref={panel} className="menu-panel" role="dialog" aria-modal="true" aria-label="Main menu">
        <div className="menu-head">
          <span className="menu-logo">{GAME_NAME}</span>
          <button className="icon-btn" aria-label="Close menu" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <div className="menu-rivets" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <nav className="menu-list">
          {ITEMS.map((it) => (
            <button
              key={it.label}
              className="menu-item"
              disabled={!it.target}
              onClick={() => {
                if (!it.target) return;
                onGo(it.target);
                onClose();
              }}
            >
              <span className="menu-code">{it.code}</span>
              <span className="menu-label">{it.label}</span>
              {it.tag ? <span className="menu-tag">{it.tag}</span> : <span className="menu-led" aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <p className="menu-foot">New sortie every day at 00:00 UTC</p>
      </div>
    </div>
  );
}

/** First-visit briefing: answer → rarer = more thrust → climb. */
export function Briefing({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [demo, setDemo] = useState(0);
  const color = useTierColor();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.querySelector<HTMLButtonElement>('.btn-primary')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (step !== 2) return;
    const seq = [0, 30, 115, 200, 285, 385, 470, 555, 640];
    let i = 0;
    setDemo(0);
    const id = setInterval(() => setDemo(seq[(i = (i + 1) % seq.length)]), 1300);
    return () => clearInterval(id);
  }, [step]);

  const pages = [
    {
      title: 'Give one answer',
      body: 'Seven prompts a day, picked at random for you. Each has many right answers. Type one before the 25-second clock runs out.',
      art: (
        <div className="brief-art brief-prompt">
          <span className="eyebrow">Prompt 1/7</span>
          <b>Name a country in Africa.</b>
          <span className="brief-input">
            Burkina Faso<i className="caret" />
          </span>
        </div>
      ),
    },
    {
      title: 'Rarer answers, more thrust',
      body: 'Obvious answers barely move the jet. Answers most people miss light the engines. Wrong? Keep trying until the clock runs out — only a timeout stalls.',
      art: (
        <table className="tier-table">
          <tbody>
            {TIER_ORDER.map((t) => (
              <tr key={t}>
                <td className="tt-medal">
                  <TierMedal tier={t} />
                </td>
                <td style={{ color: color(t) }}>{TIERS[t].name}</td>
                <td className="tt-pts">{TIERS[t].points}</td>
                <td className="tt-bar">
                  <span style={{ width: `${TIERS[t].points}%`, background: color(t) }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      title: 'Get as high as you can',
      body: 'The first 100 points are the runway. Every point after that is altitude, up to 60,000 ft at the edge of space. Two Ace-or-better answers in a row light the afterburner.',
      art: <JetScene points={demo} hud={false} banners={false} className="brief-scene" />,
    },
  ];
  const page = pages[step];
  const last = step === pages.length - 1;

  return (
    <div className="modal-root">
      <div className="modal-backdrop" onClick={onClose} />
      <div ref={box} className="panel modal" role="dialog" aria-modal="true" aria-labelledby="brief-title">
        <span className="eyebrow">
          Pre-flight briefing · {step + 1}/{pages.length}
        </span>
        {page.art}
        <h2 id="brief-title" className="modal-title">
          {page.title}
        </h2>
        <p className="muted">{page.body}</p>
        <div className="brief-dots" aria-hidden="true">
          {pages.map((_, i) => (
            <span key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>
            {step === 0 ? 'Skip' : 'Back'}
          </button>
          <button className="btn btn-primary" onClick={last ? onClose : () => setStep(step + 1)}>
            {last ? 'Ready' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
