import { useCallback, useEffect, useMemo, useState } from 'react';
import bank from './data/prompts.json';
import { dailyPrompts, dateKey, randomPrompts, sortieNumber } from './game/daily';
import { DAILY_MODE, PROMPTS_PER_FLIGHT, RECENT_DAYS } from './game/config';
import { newMedals, type Medal } from './game/stats';
import { liveStreak, load, persist, recordDaily, recordFree, withDailyPicks, type Save } from './game/storage';
import { jetById, newUnlocks, paintById } from './game/hangar';
import { zoneImg } from './game/art';
import { zoneFor, type ZoneId } from './game/flight';
import type { Session } from './game/session';
import type { FlightResult, Prompt, Turn } from './game/types';
import { useViewportHeightVar } from './hooks';
import { audio } from './audio';
import { LoadoutContext, SettingsContext, type Settings } from './settings';
import { Briefing, Menu, TopBar, type MenuTarget } from './components/Chrome';
import { Debrief } from './screens/Debrief';
import { Debug } from './screens/Debug';
import { Home } from './screens/Home';
import { FaqPage, ServiceRecord, SettingsPage } from './screens/Pages';
import { Round } from './screens/Round';
import { FlightLog, FreeFlight, Hangar, MissionPacks, newClassic, newEndurance, packSession, PACKS } from './screens/Modes';

const PROMPTS = bank as Prompt[];
const BY_ID = new Map(PROMPTS.map((p) => [p.id, p]));

/** Give `today` its random prompts. Anything already answered today keeps its place. */
function ensurePicks(save: Save, today: string): Save {
  if (DAILY_MODE !== 'random') return save;
  return withDailyPicks(
    save,
    today,
    (recent) => {
      const done = (save.history[today]?.turns ?? (save.inProgress?.dateKey === today ? save.inProgress.turns : [])).map((t) => t.promptId);
      const rest = randomPrompts(PROMPTS.filter((p) => !done.includes(p.id)), recent, PROMPTS_PER_FLIGHT - done.length);
      return [...done, ...rest.map((p) => p.id)];
    },
    RECENT_DAYS,
  );
}
type Screen = 'home' | 'round' | 'debrief';

function useHashRoute() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => {
      setHash(location.hash);
      scrollTo(0, 0);
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return hash;
}

const go = (path: string) => {
  location.hash = path;
};

export default function App() {
  useViewportHeightVar();
  const route = useHashRoute();
  const [save, setSave] = useState<Save>(() => ensurePicks(load(), dateKey()));
  const [screen, setScreen] = useState<Screen>('home');
  const [prevBest, setPrevBest] = useState(save.bestPoints);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [today, setToday] = useState(dateKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const [briefing, setBriefing] = useState(!save.seenBriefing);
  const [unlocks, setUnlocks] = useState<string[]>([]);
  // non-daily flight (Free Flight, Flight Log replay, Mission Pack)
  const [free, setFree] = useState<{ session: Session; run: number; result?: FlightResult; prevBest: number } | null>(null);

  // roll over at 00:00 UTC while the tab is open
  useEffect(() => {
    const id = setInterval(() => setToday(dateKey()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setSave((s) => ensurePicks(s, today)), [today]);
  useEffect(() => persist(save), [save]);

  // sound: follow the settings, and unlock audio on the first gesture of a visit
  const { sound, music } = save.settings;
  useEffect(() => audio.configure({ sound, music }), [sound, music]);
  useEffect(() => {
    if (!sound && !music) return;
    const go = () => audio.unlock();
    addEventListener('pointerdown', go, { once: true });
    addEventListener('keydown', go, { once: true });
    return () => {
      removeEventListener('pointerdown', go);
      removeEventListener('keydown', go);
    };
  }, [sound, music]);

  const settingsCtx = useMemo(
    () => ({ settings: save.settings, update: (patch: Partial<Settings>) => setSave((s) => ({ ...s, settings: { ...s.settings, ...patch } })) }),
    [save.settings],
  );

  const picks = save.dailyPicks.find((d) => d.dateKey === today)?.ids;
  const prompts = useMemo(
    () => (DAILY_MODE === 'random' && picks ? picks.map((id) => BY_ID.get(id)).filter((p): p is Prompt => !!p) : dailyPrompts(PROMPTS, today)),
    [picks, today],
  );
  const sortie = sortieNumber(today);
  const todays = save.history[today] ?? null;
  const progress = save.inProgress?.dateKey === today ? save.inProgress.turns : [];
  const streak = liveStreak(save, today);

  function finish(turns: Turn[]) {
    const result: FlightResult = {
      dateKey: today,
      sortie,
      turns,
      points: turns[turns.length - 1]?.total ?? 0,
      finishedAt: Date.now(),
    };
    const after = recordDaily(save, result);
    setPrevBest(save.bestPoints);
    setMedals(newMedals(save, after));
    setUnlocks(newUnlocks(save.flightHours, after.flightHours));
    setSave(after);
    setScreen('debrief');
    scrollTo(0, 0);
  }

  const recordOf = (s: Session, sv: Save) =>
    s.kind === 'pack' ? (sv.records.packs[s.key!] ?? 0) : s.kind === 'archive' ? (sv.records.archive[s.key!] ?? 0) : s.kind === 'classic' || s.kind === 'endurance' ? sv.records[s.kind] : 0;

  function startFree(session: Session) {
    setFree({ session, run: Date.now(), prevBest: recordOf(session, save) });
    setUnlocks([]);
    go('#/play');
  }

  function finishFree(turns: Turn[]) {
    if (!free || free.session.kind === 'daily') return;
    const points = turns[turns.length - 1]?.total ?? 0;
    const result: FlightResult = { dateKey: today, sortie: sortieNumber(free.session.key ?? today), turns, points, finishedAt: Date.now() };
    const after = recordFree(save, free.session.kind, points, free.session.key);
    setUnlocks(newUnlocks(save.flightHours, after.flightHours));
    setSave(after);
    setFree({ ...free, result });
    scrollTo(0, 0);
  }

  function flyAgain() {
    if (!free) return;
    const s = free.session;
    const pack = PACKS.find((p) => p.id === s.key);
    startFree(s.kind === 'classic' ? newClassic() : s.kind === 'endurance' ? newEndurance() : s.kind === 'pack' && pack ? packSession(pack) : s);
  }

  const modeHome = (s?: Session) => (s?.kind === 'archive' ? '#/log' : s?.kind === 'pack' ? '#/packs' : '#/free');

  function reset() {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    setSave(ensurePicks(load(), dateKey()));
    setScreen('home');
    go('#/');
  }

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeBriefing = useCallback(() => {
    setBriefing(false);
    setSave((s) => (s.seenBriefing ? s : { ...s, seenBriefing: true }));
  }, []);

  function onMenu(t: MenuTarget) {
    if (t === 'briefing') return setBriefing(true);
    if (t === 'daily') {
      setScreen(todays ? 'home' : screen === 'debrief' ? 'home' : screen);
      return go('#/');
    }
    go(`#/${t}`);
  }

  const back = () => go('#/');
  let body: React.ReactNode;

  if (route === '#/debug') {
    body = <Debug onReset={reset} />;
  } else if (route === '#/record') {
    body = <ServiceRecord save={save} streak={streak} onBack={back} />;
  } else if (route === '#/settings') {
    body = <SettingsPage onBack={back} onReset={reset} />;
  } else if (route === '#/faq') {
    body = <FaqPage onBack={back} />;
  } else if (route === '#/free') {
    body = <FreeFlight save={save} onStart={startFree} onBack={back} />;
  } else if (route === '#/log') {
    body = <FlightLog save={save} onStart={startFree} onBack={back} />;
  } else if (route === '#/packs') {
    body = <MissionPacks save={save} onStart={startFree} onBack={back} />;
  } else if (route === '#/hangar') {
    body = <Hangar save={save} onSelect={(patch) => setSave((s) => ({ ...s, ...patch }))} onBack={back} />;
  } else if (route === '#/play' && free && !free.result) {
    body = (
      <Round
        key={free.run}
        prompts={free.session.prompts}
        initialTurns={[]}
        maxStalls={free.session.maxStalls}
        endless={free.session.endless}
        onFinish={finishFree}
        onSuggest={(promptId, text) => setSave((s) => ({ ...s, suggestions: [...s.suggestions, { promptId, text, at: Date.now() }] }))}
      />
    );
  } else if (route === '#/play' && free?.result) {
    body = (
      <Debrief
        key={free.run}
        result={free.result}
        title={free.session.title}
        shareTitle={free.session.shareTitle}
        bestPoints={Math.max(free.prevBest, free.result.points)}
        bestLabel="best in this mode (ft)"
        newBest={free.result.points > free.prevBest}
        flightHours={save.flightHours}
        medals={[]}
        unlocks={unlocks}
        onAgain={flyAgain}
        onHome={() => go(modeHome(free.session))}
      />
    );
  } else if (screen === 'round') {
    body = (
      <Round
        key={today}
        prompts={prompts}
        initialTurns={progress}
        startedAt={save.inProgress?.dateKey === today ? save.inProgress.startedAt : undefined}
        onPromptStart={(at) =>
          setSave((s) => ({ ...s, inProgress: { dateKey: today, turns: s.inProgress?.dateKey === today ? s.inProgress.turns : [], startedAt: at } }))
        }
        onTurn={(turns) => setSave((s) => ({ ...s, inProgress: { dateKey: today, turns } }))}
        onFinish={finish}
        onSuggest={(promptId, text) => setSave((s) => ({ ...s, suggestions: [...s.suggestions, { promptId, text, at: Date.now() }] }))}
      />
    );
  } else if (screen === 'debrief' && todays) {
    body = (
      <Debrief
        result={todays}
        streak={streak}
        bestPoints={save.bestPoints}
        newBest={todays.points > prevBest}
        flightHours={save.flightHours}
        medals={medals}
        unlocks={unlocks}
        onHome={() => {
          setMedals([]);
          setUnlocks([]);
          setScreen('home');
        }}
      />
    );
  } else {
    body = (
      <Home
        sortie={sortie}
        today={today}
        streak={streak}
        todays={todays}
        resumeAt={progress.length}
        onPlay={() => (progress.length >= prompts.length ? finish(progress) : setScreen('round'))}
        onDebrief={() => {
          setPrevBest(save.bestPoints);
          setScreen('debrief');
        }}
      />
    );
  }

  const inCockpit =
    (screen === 'round' && !route.match(/^#\/(record|settings|faq|free|log|packs|hangar|play)$/)) || route === '#/debug' || (route === '#/play' && !!free && !free.result);
  // painted background behind non-cockpit screens: the zone you reached (or the dawn airbase)
  const backdropZone: ZoneId =
    route === '#/play' && free?.result
      ? zoneFor(free.result.points).id
      : screen === 'debrief' && todays && !route.match(/^#\/./)
        ? zoneFor(todays.points).id
        : todays && (route === '' || route === '#/')
          ? zoneFor(todays.points).id
          : 'taxiway';
  const bg = zoneImg(backdropZone);

  const loadout = useMemo(() => ({ jet: jetById(save.selectedJet).id, paint: paintById(save.selectedPaint) }), [save.selectedJet, save.selectedPaint]);

  // #/play with nothing to play (e.g. after a refresh): back to the airbase
  useEffect(() => {
    if (route === '#/play' && !free) go('#/');
  }, [route, free]);

  return (
    <SettingsContext.Provider value={settingsCtx}>
      <LoadoutContext.Provider value={loadout}>
      {!inCockpit && (
        <div
          className="backdrop"
          aria-hidden="true"
          style={{ '--bg-tall': `url(${bg.tall})`, '--bg-wide': `url(${bg.wide})` } as React.CSSProperties}
        />
      )}
      <div className="app">
        {!inCockpit && <TopBar onMenu={() => setMenuOpen(true)} />}
        {body}
      </div>
      <Menu open={menuOpen} onClose={closeMenu} onGo={onMenu} />
      {briefing && !inCockpit && <Briefing onClose={closeBriefing} />}
      </LoadoutContext.Provider>
    </SettingsContext.Provider>
  );
}
