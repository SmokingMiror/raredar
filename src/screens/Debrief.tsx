import { useMemo, useState } from 'react';
import tower from '../data/tower.json';
import { feet, isAirborne, rankFor, zoneFor } from '../game/flight';
import { copyText, shareText } from '../game/share';
import type { FlightResult } from '../game/types';
import type { Medal } from '../game/stats';
import { MedalIcon } from './Pages';
import { useCountUp } from '../hooks';
import { FlightChart, RankPatch, TierSquares } from '../components/bits';

interface Props {
  result: FlightResult;
  bestPoints: number;
  newBest: boolean;
  flightHours: number;
  medals: Medal[];
  /** Newly unlocked hangar items. */
  unlocks?: string[];
  /** Header line, e.g. "Debrief · Sortie #13" or "Free Flight · Endurance". */
  title?: string;
  /** Share heading; defaults to "Sortie #N". */
  shareTitle?: string;
  /** Daily only: omit to hide the streak tile. */
  streak?: number;
  bestLabel?: string;
  onHome: () => void;
  onAgain?: () => void;
}

export function Debrief({ result, streak, bestPoints, newBest, flightHours, medals, unlocks = [], title, shareTitle, bestLabel = 'best altitude (ft)', onHome, onAgain }: Props) {
  const share = shareText(result, shareTitle);
  const airborne = isAirborne(result.points);
  const alt = useCountUp(feet(result.points), 1400);
  const rank = rankFor(result.points);
  const zone = zoneFor(result.points);
  const [copied, setCopied] = useState<null | boolean>(null);
  const aborted = useMemo(() => tower.aborted[Math.floor(Math.random() * tower.aborted.length)], []);

  return (
    <div className="screen debrief">
      <span className="eyebrow">{title ?? `Debrief · Sortie #${result.sortie}`}</span>
      {airborne ? (
        <h1 className="big-alt">
          {alt.toLocaleString('en-US')}
          <small> FT</small>
        </h1>
      ) : (
        <>
          <h1 className="big-alt big-alt-ground">Never left the runway</h1>
          <p className="muted">{aborted}</p>
        </>
      )}
      {newBest && airborne && <p className="pb">NEW PERSONAL BEST</p>}

      <div className="panel rank-card">
        <RankPatch level={rank.level} />
        <div>
          <span className="eyebrow">Pilot rank</span>
          <h2 className="rank-name">{rank.name}</h2>
          <p className="muted">
            {result.points} pts · reached {zone.name}
          </p>
        </div>
      </div>

      <div className="panel chart-panel">
        <span className="eyebrow">Flight path</span>
        <FlightChart turns={result.turns} />
        <TierSquares turns={result.turns} />
      </div>

      {medals.length > 0 && (
        <div className="panel new-medals" role="status">
          <span className="eyebrow">Medal{medals.length > 1 ? 's' : ''} awarded</span>
          {medals.map((m) => (
            <div key={m.id} className="new-medal">
              <MedalIcon earned />
              <div>
                <b>{m.name}</b>
                <span className="muted">{m.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {unlocks.length > 0 && (
        <div className="panel new-medals" role="status">
          <span className="eyebrow">New in the hangar</span>
          {unlocks.map((u) => (
            <b key={u} className="new-medal">
              🔓 {u}
            </b>
          ))}
        </div>
      )}

      <div className="stats">
        {streak != null && (
          <div>
            <b>{streak}</b>
            <span>sortie streak</span>
          </div>
        )}
        <div>
          <b>{isAirborne(bestPoints) ? `${(feet(bestPoints) / 1000).toFixed(1)}K` : '—'}</b>
          <span>{bestLabel}</span>
        </div>
        <div>
          <b>+{result.points}</b>
          <span>flight hours · {flightHours} total</span>
        </div>
      </div>

      <button
        className="btn btn-primary btn-wide"
        onClick={async () => setCopied(await copyText(share))}
      >
        {copied === true ? 'Copied to clipboard ✓' : copied === false ? 'Copy failed' : 'Share'}
      </button>
      {copied === false && <pre className="share-fallback">{share}</pre>}
      {onAgain && (
        <button className="btn btn-ghost btn-wide" onClick={onAgain}>
          Fly again
        </button>
      )}
      <button className="btn btn-ghost btn-wide" onClick={onHome}>
        Back to the airbase
      </button>
    </div>
  );
}
