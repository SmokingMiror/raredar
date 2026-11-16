import { useState } from 'react';
import { TIERS } from '../game/config';
import { MAX_POINTS, TAKEOFF_POINTS, feet } from '../game/flight';
import type { TierId, Turn } from '../game/types';
import { TIER_LETTER, useSettings, useTierColor } from '../settings';
import { rankImg, tierImg } from '../game/art';

export function TimerArc({ remaining, total }: { remaining: number; total: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, remaining / total);
  const color = remaining <= 5 ? 'var(--danger)' : remaining <= 10 ? 'var(--warn)' : 'var(--hud)';
  return (
    <div className={`timer ${remaining <= 5 ? 'timer-low' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 60 60" width="60" height="60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(108,255,143,0.15)" strokeWidth="4" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 30 30)"
          strokeLinecap="butt"
        />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="30" y1="2" x2="30" y2="6" stroke={color} strokeWidth="1.5" transform={`rotate(${i * 90} 30 30)`} />
        ))}
      </svg>
      <span style={{ color }}>{Math.ceil(remaining)}</span>
    </div>
  );
}

export function TierBadge({ tier, size = 'lg' }: { tier: TierId; size?: 'lg' | 'sm' }) {
  const info = TIERS[tier];
  const color = useTierColor();
  const img = size === 'lg' ? tierImg(tier) : null;
  return (
    <span className={`tier-badge-wrap tier-${size}-wrap`}>
      {img && <img className="tier-medal" src={img} alt="" width={64} height={64} />}
      <span className={`tier-badge tier-${tier} tier-${size}`} style={{ '--tier': color(tier) } as React.CSSProperties}>
        {info.name}
      </span>
    </span>
  );
}

/** Small medal image for tables and charts (nothing for Stall). */
export function TierMedal({ tier, size = 22 }: { tier: TierId; size?: number }) {
  const img = tierImg(tier);
  return img ? <img src={img} alt="" width={size} height={size} className="tier-medal-sm" /> : <span style={{ width: size, display: 'inline-block' }} />;
}

/** Rank patch art, falling back to the SVG insignia if the image fails to load. */
export function RankPatch({ level, size = 96 }: { level: number; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <RankInsignia level={level} size={size} />;
  return <img src={rankImg(level)} alt="" width={size} height={size} className="rank-patch" onError={() => setFailed(true)} />;
}

export function TierSquares({ turns, total = Math.max(7, turns.length) }: { turns: Pick<Turn, 'tier'>[]; total?: number }) {
  const color = useTierColor();
  const { colorBlind } = useSettings().settings;
  return (
    <div className="squares" aria-label={`Tiers: ${turns.map((t) => TIERS[t.tier].name).join(', ')}`}>
      {Array.from({ length: total }, (_, i) => {
        const t = turns[i];
        return (
          <span key={i} className="square" style={{ background: t ? color(t.tier) : 'transparent' }} title={t ? TIERS[t.tier].name : ''}>
            {t && colorBlind ? TIER_LETTER[t.tier] : null}
          </span>
        );
      })}
    </div>
  );
}

/** Original rank insignia: bar → chevrons → wings → star. */
export function RankInsignia({ level, size = 72 }: { level: number; size?: number }) {
  const chevrons = level === 0 ? 0 : Math.min(level, 3);
  const wings = level >= 4;
  const star = level >= 6;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#0d1420" stroke="#6cff8f" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#6cff8f" strokeOpacity="0.3" strokeWidth="1" />
      {level === 0 && <rect x="30" y="46" width="40" height="8" rx="2" fill="#9aa4b2" />}
      {Array.from({ length: chevrons }, (_, i) => (
        <path key={i} d={`M28,${60 - i * 11} L50,${48 - i * 11} L72,${60 - i * 11}`} fill="none" stroke="#ffe08a" strokeWidth="5" strokeLinejoin="round" />
      ))}
      {wings && (
        <g fill="#eaf2ff">
          <path d="M44,70 C34,64 22,64 12,58 C22,70 32,74 44,76 Z" />
          <path d="M56,70 C66,64 78,64 88,58 C78,70 68,74 56,76 Z" />
          <circle cx="50" cy="73" r="5" fill="#ffe08a" />
        </g>
      )}
      {level === 5 && <circle cx="50" cy="22" r="4" fill="#ffe08a" />}
      {star && <path d="M50,12 L53,20 L61,20 L55,25 L57,33 L50,28 L43,33 L45,25 L39,20 L47,20 Z" fill="#ffe08a" />}
    </svg>
  );
}

/** Altitude after each prompt. The runway is drawn as a band below the take-off line. */
export function FlightChart({ turns }: { turns: Turn[] }) {
  const color = useTierColor();
  const w = 320;
  const h = 150;
  const pad = { l: 40, r: 10, t: 10, b: 22 };
  const max = Math.max(MAX_POINTS, ...turns.map((t) => t.total));
  const n = Math.max(7, turns.length);
  const x = (i: number) => pad.l + (i / n) * (w - pad.l - pad.r);
  const y = (pts: number) => h - pad.b - (pts / max) * (h - pad.t - pad.b);
  const pts = [0, ...turns.map((t) => t.total)];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`Flight path: ${turns.map((t) => feet(t.total).toLocaleString('en-US') + ' ft').join(', ')}`}>
      <rect x={pad.l} y={y(TAKEOFF_POINTS)} width={w - pad.l - pad.r} height={y(0) - y(TAKEOFF_POINTS)} fill="rgba(255,179,71,0.12)" />
      <rect x={pad.l} y={y(max)} width={w - pad.l - pad.r} height={y(600) - y(max)} fill="rgba(183,124,255,0.1)" />
      {[100, 400, 600, 700].map((z) => (
        <g key={z}>
          <line x1={pad.l} x2={w - pad.r} y1={y(z)} y2={y(z)} stroke="rgba(108,255,143,0.25)" strokeDasharray="3 3" />
          <text x={pad.l - 5} y={y(z) + 3} textAnchor="end" className="chart-label">
            {z === 100 ? 'T/O' : `${(z - 100) / 10}K`}
          </text>
        </g>
      ))}
      <text x={pad.l - 5} y={y(0) + 3} textAnchor="end" className="chart-label">RWY</text>
      <polyline points={pts.map((p, i) => `${x(i)},${y(p)}`).join(' ')} fill="none" stroke="#6cff8f" strokeWidth="2" strokeLinejoin="round" />
      {turns.map((t, i) => (
        <circle key={i} cx={x(i + 1)} cy={y(t.total)} r="4" fill={color(t.tier)} stroke="#0d1420" strokeWidth="1.5" />
      ))}
      {Array.from({ length: n }, (_, i) => (n <= 12 || (i + 1) % 5 === 0) && (
        <text key={i} x={x(i + 1)} y={h - 6} textAnchor="middle" className="chart-label">
          {i + 1}
        </text>
      ))}
    </svg>
  );
}
