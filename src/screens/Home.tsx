import { GAME_NAME, TAGLINE } from '../game/config';
import { LOGO_IMG } from '../game/art';
import { feet, isAirborne, rankFor } from '../game/flight';
import { formatCountdown, msToNextSortie } from '../game/daily';
import type { FlightResult } from '../game/types';
import { useNow } from '../hooks';
import { JetScene } from '../components/JetScene';
import { TierSquares } from '../components/bits';

interface Props {
  sortie: number;
  today: string;
  streak: number;
  todays: FlightResult | null;
  resumeAt: number;
  onPlay: () => void;
  onDebrief: () => void;
}

export function Home({ sortie, today, streak, todays, resumeAt, onPlay, onDebrief }: Props) {
  const now = useNow(1000);
  const date = new Date(`${today}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <div className="screen home">
      <header className="home-head">
        <h1 className="logo-wrap">
          <img className="logo-img" src={LOGO_IMG} alt={GAME_NAME} width={900} height={214} />
        </h1>
        <p className="tagline">{TAGLINE}</p>
        <p className="eyebrow">
          {date} · Sortie #{sortie}
        </p>
      </header>

      <JetScene points={todays ? todays.points : 0} hud={false} banners={false} className="home-scene" />

      {todays ? (
        <div className="panel flown">
          <span className="eyebrow">Today's sortie</span>
          <h2 className="flown-alt">
            {isAirborne(todays.points) ? `${feet(todays.points).toLocaleString('en-US')} ft` : 'Never left the runway'}
          </h2>
          <p className="muted">{rankFor(todays.points).name}</p>
          <TierSquares turns={todays.turns} />
          <p className="countdown">
            Next sortie in <b>{formatCountdown(msToNextSortie(new Date(now)))}</b>
          </p>
          <button className="btn btn-ghost btn-wide" onClick={onDebrief}>
            View debrief
          </button>
        </div>
      ) : (
        <button className="btn btn-scramble" onClick={onPlay}>
          {resumeAt > 0 ? `Resume sortie · ${resumeAt + 1}/7` : 'Scramble'}
        </button>
      )}

      <p className="streak">
        <b>{streak}</b> consecutive {streak === 1 ? 'sortie' : 'sorties'}
      </p>
      <p className="how">7 prompts · 25 seconds each · rarer answers fly higher</p>
      <a className="debug-link" href="#/debug">
        Flight scrubber (debug)
      </a>
    </div>
  );
}
