import { useState } from 'react';
import { TIERS, TIER_ORDER } from '../game/config';
import { feet, knots, rankFor, readout, zoneFor } from '../game/flight';
import type { TierId } from '../game/types';
import { useTierColor } from '../settings';
import { JetScene, type SceneEffect } from '../components/JetScene';

/** Step 2 debug tool: scrub the whole flight and fire tier effects. */
export function Debug({ onReset }: { onReset: () => void }) {
  const [points, setPoints] = useState(0);
  const [effect, setEffect] = useState<SceneEffect | null>(null);
  const [ab, setAb] = useState(false);
  const color = useTierColor();
  const fire = (tier: TierId) => {
    setEffect({ tier, id: Date.now() });
    setPoints((p) => Math.min(760, p + TIERS[tier].points));
  };

  return (
    <div className="round">
      <JetScene points={points} effect={effect} afterburner={ab} className="round-scene" />
      <div className="panel round-panel debug">
        <span className="eyebrow">Flight scrubber</span>
        <label className="slider">
          <input type="range" min={0} max={760} value={points} onChange={(e) => setPoints(+e.target.value)} aria-label="Points" />
          <output>
            {points} pts · {readout(points)}
          </output>
        </label>
        <p className="muted">
          Zone: {zoneFor(points).name} · Rank: {rankFor(points).name} · {knots(points)} kt / {feet(points).toLocaleString('en-US')} ft
        </p>
        <div className="debug-buttons">
          {[0, 50, 99, 100, 250, 400, 600, 700].map((p) => (
            <button key={p} className="btn btn-ghost btn-sm" onClick={() => setPoints(p)}>
              {p}
            </button>
          ))}
        </div>
        <span className="eyebrow">Fire a tier (adds its points)</span>
        <div className="debug-buttons">
          {TIER_ORDER.map((t) => (
            <button key={t} className="btn btn-ghost btn-sm" style={{ color: color(t) }} onClick={() => fire(t)}>
              {TIERS[t].name}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={ab} onChange={(e) => setAb(e.target.checked)} /> Afterburner streak
        </label>
        <div className="debug-buttons">
          <a className="btn btn-ghost btn-sm" href="#/">
            ← Airbase
          </a>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (confirm('Wipe all saved progress on this device?')) onReset();
            }}
          >
            Reset saved data
          </button>
        </div>
      </div>
    </div>
  );
}
