import { useEffect, useMemo, useRef, useState } from 'react';
import tower from '../data/tower.json';
import { AFTERBURNER_BONUS, SECONDS_PER_PROMPT, TIERS } from '../game/config';
import { TAKEOFF_POINTS, afterburnerLit, scoreTurn, zoneFor } from '../game/flight';
import { audio } from '../audio';
import { key, matchAnswer } from '../game/match';
import type { Answer, Prompt, TierId, Turn } from '../game/types';
import { useCountUp } from '../hooks';
import { useTierColor } from '../settings';
import { JetScene, type SceneEffect } from '../components/JetScene';
import { TierBadge, TierSquares, TimerArc } from '../components/bits';
import { SoundToggle } from '../components/Chrome';
import { TOWER_IMG } from '../game/art';

interface Props {
  prompts: Prompt[];
  initialTurns: Turn[];
  /** When the current prompt was first shown (survives a refresh so the clock can't be reset). */
  startedAt?: number;
  onPromptStart?: (at: number) => void;
  onTurn?: (turns: Turn[]) => void;
  /** Endurance: the flight ends after this many Stalls. */
  maxStalls?: number;
  /** Hide the "/7" (endless modes). */
  endless?: boolean;
  onFinish: (turns: Turn[]) => void;
  onSuggest: (promptId: string, text: string) => void;
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** 3–5 other answers to show, always including the Sonic Boom gem(s). */
function otherAnswers(prompt: Prompt, mine: string | null): Answer[] {
  const pool = prompt.answers.filter((a) => a.text !== mine);
  const out: Answer[] = pool.filter((a) => a.tier === 'sonic').slice(0, 2);
  for (const tier of ['stealth', 'ace', 'wingman', 'rookie'] as TierId[]) {
    if (out.length >= 5) break;
    const c = pool.filter((a) => a.tier === tier);
    if (c.length) out.push(pick(c));
  }
  return out;
}

const stallCount = (turns: Turn[]) => turns.filter((t) => t.tier === 'stall').length;

export function Round({ prompts, initialTurns, startedAt, onPromptStart, onTurn, onFinish, onSuggest, maxStalls, endless }: Props) {
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [phase, setPhase] = useState<'answer' | 'reveal'>('answer');
  const [input, setInput] = useState('');
  const [deadline, setDeadline] = useState(() => (startedAt ?? Date.now()) + SECONDS_PER_PROMPT * 1000);
  const [remaining, setRemaining] = useState(SECONDS_PER_PROMPT);
  const [effect, setEffect] = useState<SceneEffect | null>(null);
  const [announce, setAnnounce] = useState('');
  const [misses, setMisses] = useState<string[]>([]);
  const [miss, setMiss] = useState<{ text: string; repeat: boolean; id: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  const index = phase === 'answer' ? turns.length : turns.length - 1;
  const prompt = prompts[index];
  const last = turns[turns.length - 1];
  const points = last?.total ?? 0;

  // ---- sound -------------------------------------------------------------
  const lit = afterburnerLit(turns);
  useEffect(() => {
    audio.engineOn();
    return () => {
      audio.engineOff();
      audio.setZone('taxiway');
    };
  }, []);
  const prevPoints = useRef(points);
  useEffect(() => {
    audio.setPoints(points);
    audio.setZone(zoneFor(points).id);
    if (prevPoints.current < TAKEOFF_POINTS && points >= TAKEOFF_POINTS) setTimeout(() => audio.airborne(), 900);
    prevPoints.current = points;
  }, [points]);
  useEffect(() => audio.setAfterburner(lit), [lit]);

  useEffect(() => {
    if (!startedAt) onPromptStart?.(deadline - SECONDS_PER_PROMPT * 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // countdown
  useEffect(() => {
    if (phase !== 'answer') return;
    const id = setInterval(() => {
      const left = Math.max(0, (deadline - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) submit(true);
    }, 100);
    return () => clearInterval(id);
  }); // re-bound each render so submit sees current input

  const whole = Math.ceil(remaining);
  useEffect(() => {
    if (phase === 'answer' && (whole === 10 || whole === 5)) setAnnounce(`${whole} seconds left`);
    if (phase === 'answer' && whole <= 5 && whole > 0) audio.tick();
  }, [whole, phase]);

  useEffect(() => {
    if (phase === 'answer') inputRef.current?.focus();
  }, [phase, index, miss]);

  function submit(timeout = false) {
    if (submitted.current || phase !== 'answer') return;
    const text = input.trim();
    const match = timeout ? null : matchAnswer(prompt, text);

    // Wrong answer with time left: say so and let them try again.
    if (!timeout && !match) {
      const repeat = misses.some((m) => key(m) === key(text));
      if (!repeat) setMisses((m) => [...m, text]);
      setMiss({ text, repeat, id: Date.now() });
      setInput('');
      setEffect({ tier: 'stall', id: Date.now() });
      audio.wrong();
      setAnnounce(repeat ? `Already tried ${text}. Try something else.` : `${text} is not correct. Try again.`);
      inputRef.current?.focus();
      return;
    }

    submitted.current = true;
    const tier: TierId = match ? match.tier : 'stall';
    const tries = timeout && text && !misses.some((m) => key(m) === key(text)) ? [...misses, text] : misses;
    const turn: Turn = { ...scoreTurn(turns, prompt.id, match ? text : (tries.at(-1) ?? ''), match?.text ?? null, tier), misses: tries };
    const next = [...turns, turn];
    setTurns(next);
    onTurn?.(next);
    setEffect({ tier, id: Date.now() });
    audio.tier(tier);
    setPhase('reveal');
    setMiss(null);
    setAnnounce(`${TIERS[tier].name}. ${turn.base + turn.bonus} points.${timeout ? ' Time ran out.' : ''}`);
  }

  const finished = (t: Turn[]) => t.length >= prompts.length || (maxStalls != null && stallCount(t) >= maxStalls);

  function next() {
    if (finished(turns)) {
      onFinish(turns);
      return;
    }
    submitted.current = false;
    setInput('');
    setMisses([]);
    const now = Date.now();
    setDeadline(now + SECONDS_PER_PROMPT * 1000);
    onPromptStart?.(now);
    setRemaining(SECONDS_PER_PROMPT);
    setPhase('answer');
  }

  return (
    <div className="round">
      <JetScene points={points} effect={effect} afterburner={afterburnerLit(turns)} className="round-scene" />
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
      <div className="panel round-panel">
        <div className="round-meta">
          <span className="eyebrow">
            Prompt {index + 1}
            {endless ? '' : `/${prompts.length}`}
          </span>
          {maxStalls != null ? (
            <span className="stall-meter" aria-label={`${maxStalls - stallCount(turns)} engines left`}>
              {Array.from({ length: maxStalls }, (_, i) => (
                <i key={i} className={i < maxStalls - stallCount(turns) ? 'on' : ''} />
              ))}
            </span>
          ) : (
            <TierSquares turns={turns} total={prompts.length} />
          )}
          <SoundToggle />
        </div>
        <h1 className="prompt-text">{prompt.text}</h1>

        {phase === 'answer' && miss && (
          <p key={miss.id} className="miss-msg" role="alert">
            <span aria-hidden="true">✕</span> “{miss.text}” {miss.repeat ? '— already tried. Try something else.' : '— not correct. Try again.'}
          </p>
        )}
        {phase === 'answer' && misses.length > 0 && (
          <p className="miss-list">
            Tried: {misses.map((m) => `“${m}”`).join(', ')}
          </p>
        )}

        {phase === 'answer' ? (
          <form
            className="answer-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) submit();
            }}
          >
            <TimerArc remaining={remaining} total={SECONDS_PER_PROMPT} />
            <input
              ref={inputRef}
              key={miss?.id ?? 0}
              className={`answer-input ${miss ? 'answer-shake' : ''}`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                audio.click();
              }}
              placeholder="One answer…"
              aria-label={`Answer for: ${prompt.text}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="send"
              maxLength={60}
            />
            <button className="btn btn-fire" type="submit" disabled={!input.trim()}>
              FIRE
            </button>
          </form>
        ) : (
          <Reveal key={index} prompt={prompt} turn={last} streakLit={afterburnerLit(turns)} onNext={next} isLast={finished(turns)} onSuggest={onSuggest} />
        )}
      </div>
    </div>
  );
}

function Reveal({
  prompt,
  turn,
  streakLit,
  onNext,
  isLast,
  onSuggest,
}: {
  prompt: Prompt;
  turn: Turn;
  streakLit: boolean;
  onNext: () => void;
  isLast: boolean;
  onSuggest: (promptId: string, text: string) => void;
}) {
  const gained = useCountUp(turn.base + turn.bonus, 900);
  const color = useTierColor();
  const line = useMemo(() => pick((tower as Record<string, string[]>)[turn.tier]), [turn]);
  const others = useMemo(() => otherAnswers(prompt, turn.matched), [prompt, turn]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const tries = turn.misses ?? [];
  // brief lockout so a double-tap of Enter can't skip the reveal
  const [armed, setArmed] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      setArmed(true);
      btn.current?.focus({ preventScroll: true });
    }, 700);
    return () => clearTimeout(id);
  }, []);
  const isStall = turn.tier === 'stall';
  useEffect(() => {
    const id = setTimeout(() => audio.radio(), 450);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="reveal">
      <div className="reveal-head">
        <div className="stamp">
          <TierBadge tier={turn.tier} />
        </div>
        <div className="gain">
          <span className="gain-num" style={{ color: color(turn.tier) }}>
            +{gained}
          </span>
          {turn.bonus > 0 && <span className="gain-bonus">AFTERBURNER +{AFTERBURNER_BONUS}</span>}
          {streakLit && turn.bonus === 0 && <span className="gain-bonus">AFTERBURNER LIT</span>}
        </div>
      </div>

      <p className="your-answer">
        {isStall ? (
          <>Out of time. Engine stalled.</>
        ) : (
          <>
            You said <strong>{turn.matched}</strong>
            {tries.length > 0 && <span className="muted"> · after {tries.length} miss{tries.length > 1 ? 'es' : ''}</span>}
          </>
        )}
      </p>
      {tries.length > 0 && (
        <div className="suggest-row">
          <span className="muted small">Think one of these should count?</span>
          {tries.slice(-3).map((m) => (
            <button
              key={m}
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={suggested.includes(m)}
              onClick={() => {
                onSuggest(prompt.id, m);
                setSuggested((s) => [...s, m]);
              }}
            >
              {suggested.includes(m) ? `“${m}” logged ✓` : `Suggest “${m}”`}
            </button>
          ))}
        </div>
      )}

      <p className="tower-line">
        <img src={TOWER_IMG} alt="" width={28} height={28} className="tower-icon" />
        <span className="tower-tag">TWR</span> {line}
      </p>

      <div className="others">
        <span className="eyebrow">Other answers on the plan</span>
        <ul>
          {others.map((a) => (
            <li key={a.text}>
              <span>{a.text}</span>
              <TierBadge tier={a.tier} size="sm" />
            </li>
          ))}
        </ul>
      </div>

      <button ref={btn} className="btn btn-primary btn-wide" onClick={() => armed && onNext()} aria-disabled={!armed}>
        {isLast ? 'Land & debrief' : 'Next prompt'}
      </button>
    </div>
  );
}
