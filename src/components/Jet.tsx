/** Six fighters drawn as realistic side profiles (slightly from below, so the
 *  wing planform shows), facing right and centred on (0,0). Nozzle exit at x≈-45. */
export interface Paint {
  body: string;
  accent: string;
}

export const DEFAULT_PAINT: Paint = { body: '#b9c2cc', accent: '#3b82c4' };

export type JetId = 'swift' | 'kestrel' | 'stingray' | 'nightjar' | 'peregrine' | 'aurora';

interface Geometry {
  fuselage: string;
  canopy: string;
  /** Dorsal hump behind the canopy. */
  spine: string;
  /** Near vertical fin. */
  fin: string;
  /** Far fin of a twin-tail jet, drawn behind and in shadow. */
  fin2?: string;
  /** Intake mouth (dark). */
  intake?: string;
  /** Raised intake housing on the fuselage side. */
  intakeBody?: string;
  wingNear: string;
  wingFar: string;
  tailplane?: string;
  canard?: string;
  ventral?: string;
  /** Wingtip rail / missile / pod. */
  wingTip?: string;
  /** Panel lines (stroke only). */
  panels: string;
  /** Nose radome boundary x. */
  radomeX: number;
  /** Rectangular (vectoring) nozzle instead of round. */
  squareNozzle?: boolean;
}

const GEOMETRY: Record<JetId, Geometry> = {
  // Lightweight single-engine fighter: chin intake, frameless bubble canopy, cropped delta, single fin.
  swift: {
    fuselage:
      'M54,0.6 C47,-1 38,-3.4 28,-4.6 C18,-5.6 10,-7.6 -2,-7.8 L-34,-6.8 L-41,-4.8 L-45,-4.2 L-45,4.2 L-41,4.8 L-30,6.6 L-6,7.2 L8,8.8 L21,9.4 L23,4.4 C34,3.4 45,2.2 54,0.6 Z',
    intake: 'M23,4.4 L22.4,9.4 L19,9.4 L19.6,5.2 Z',
    spine: 'M10,-6.8 C2,-9.6 -14,-9.8 -30,-7.2 L-30,-6 L10,-6 Z',
    canopy: 'M32,-4.3 C28,-10.6 15,-11.8 6,-7.4 C15,-6.2 24,-5.2 32,-4.3 Z',
    fin: 'M-12,-7.6 L-33,-27 L-39.5,-27 L-40.5,-6.8 Z',
    wingNear: 'M28,2.4 C20,3.2 13,3.8 8,5 L-24,13.6 L-31,13.6 L-31,4.6 Z',
    wingFar: 'M22,1.2 C14,1.6 8,2 4,2.6 L-22,7.4 L-28,7.4 L-29,2 Z',
    wingTip: 'M-20,13.2 L-35,13.2 L-37,14.4 L-35,15.4 L-20,15.4 Z',
    tailplane: 'M-29,1.4 L-47,6.6 L-47,8.8 L-42,8.8 L-27,3.6 Z',
    ventral: 'M-22,6.8 L-28,11.4 L-31,11.4 L-30,6.6 Z',
    panels: 'M-4,-7.6 L-4,6.8 M-20,-7.2 L-20,6.8 M-33,-12 L-39.8,-12 M10,-6.6 L12,8.6 M-12,-7.6 L-34,-6.6',
    radomeX: 42,
  },
  // Carrier strike fighter: big leading-edge extensions, twin canted fins set forward, side intakes.
  kestrel: {
    fuselage:
      'M53,0.6 C46,-1.2 37,-3.6 27,-4.8 C17,-6 8,-7.4 -4,-7.4 L-34,-6.4 L-41,-4.6 L-45,-4.2 L-45,4.2 L-41,4.6 L-30,6.4 L14,7 C29,5 43,2.8 53,0.6 Z',
    intakeBody: 'M14,1.2 L-4,1 L-6,8.2 L12,8.2 Z',
    intake: 'M14,1.2 L11,1.2 L9.6,8.2 L12,8.2 Z',
    spine: 'M10,-6.6 C2,-9 -12,-9.2 -28,-6.9 L-28,-5.5 L10,-5.5 Z',
    canopy: 'M33,-4.5 C29,-11 16,-11.8 6,-7.2 C16,-6.2 25,-5.3 33,-4.5 Z',
    fin: 'M-4,-7.3 L-24,-25 L-31,-25 L-28,-6.9 Z',
    fin2: 'M1,-7.4 L-18,-22.6 L-24.5,-22.6 L-22,-7.1 Z',
    wingNear: 'M31,2.2 C23,2.8 16,3.4 6,4.6 L-15,14.4 L-23,14.4 L-29,5 Z',
    wingFar: 'M25,1.2 C18,1.4 10,1.8 4,2.2 L-11,7.6 L-17,7.6 L-25,2 Z',
    wingTip: 'M-13,14 L-27,14 L-29,15 L-27,16 L-13,16 Z',
    tailplane: 'M-29,1.4 L-47,6.2 L-47,9 L-38,9 L-27,3.6 Z',
    panels: 'M-6,-7.4 L-8,6.4 M-22,-6.8 L-22,6.4 M20,-5.8 L20,6.4 M-26,-13 L-30.4,-20',
    radomeX: 42,
  },
  // Heavy air-superiority fighter: box intakes, tall canopy, big wing, twin vertical fins, stabs past the nozzles.
  stingray: {
    fuselage:
      'M54,0.6 C47,-1.2 38,-3.8 28,-5.4 C18,-6.8 10,-8 0,-8 L-36,-7 L-42,-4.8 L-45,-4.4 L-45,4.4 L-42,4.8 L-34,6.2 L18,6.4 C31,5 44,2.8 54,0.6 Z',
    intakeBody: 'M24,-2.4 L-10,-3.2 L-10,7.6 L22,7.6 Z',
    intake: 'M24,-2.4 L20.6,-2.6 L19,7.6 L22,7.6 Z',
    spine: 'M12,-7.2 C4,-10 -10,-10 -26,-7.6 L-26,-6 L12,-6 Z',
    canopy: 'M36,-4.8 C32,-12.8 18,-13.4 8,-7.8 C18,-6.8 28,-5.8 36,-4.8 Z',
    fin: 'M-18,-7.6 L-35,-27 L-41.5,-27 L-42,-7 Z',
    fin2: 'M-14,-7.8 L-30,-24.6 L-36,-24.6 L-37,-7.2 Z',
    wingNear: 'M10,4.6 L-29,5.4 L-33,15.4 L-23,15.4 Z',
    wingFar: 'M6,2 L-27,2.4 L-29,8.6 L-21,8.6 Z',
    wingTip: 'M-23,15 L-36,15 L-38,16 L-36,17 L-23,17 Z',
    tailplane: 'M-30,1.6 L-50,6 L-50,9.4 L-40,9.4 L-28,3.8 Z',
    panels: 'M2,-3 L2,7.4 M-24,-7.2 L-24,6.2 M14,-6.8 L14,-3 M-36,-14 L-41.6,-14',
    radomeX: 42,
  },
  // Canard-delta multirole: chin intake, foreplanes by the cockpit, big delta, single fin.
  nightjar: {
    fuselage:
      'M53,0.6 C46,-1.2 37,-3.8 27,-5 C16,-6.2 6,-7.6 -6,-7.6 L-36,-6.6 L-42,-4.6 L-45,-4.2 L-45,4.2 L-42,4.6 L-34,6.4 L-6,7.6 L10,9.4 L22,9.6 L24,4.4 C35,3.4 45,2.2 53,0.6 Z',
    intake: 'M24,4.4 L22.4,9.6 L18.6,9.6 L19.6,5.4 Z',
    spine: 'M13,-6.6 C5,-9.4 -10,-9.4 -26,-7.2 L-26,-6 L13,-6 Z',
    canopy: 'M33,-4.6 C29,-10.6 19,-11.6 10,-7.2 C18,-6.2 26,-5.4 33,-4.6 Z',
    fin: 'M-12,-7.6 L-33,-27.4 L-38,-27.4 L-40,-6.8 Z',
    canard: 'M32,1.6 L21,2.2 L17,5.4 L23,4.8 Z',
    wingNear: 'M10,4.4 L-41,4.8 L-41,15.6 L-36,15.6 Z',
    wingFar: 'M6,1.6 L-39,2 L-39,8 L-34,8 Z',
    wingTip: 'M-34,15.2 L-44,15.2 L-44,17.2 L-34,17.2 Z',
    panels: 'M-2,-7.4 L-2,7.6 M-20,-7 L-20,7 M12,-6.4 L14,9.2 M-28,-14 L-37.4,-14',
    radomeX: 43,
  },
  // Single-engine stealth: chined faceted body, caret intakes, canted twin fins, trapezoid wing.
  peregrine: {
    fuselage:
      'M51,0.4 L41,-2.4 L29,-5.4 L15,-7.6 L-2,-8.8 L-30,-8.2 L-40,-5.4 L-45,-4.6 L-45,4.6 L-40,5.4 L-30,7.4 L8,8 L24,5.8 L38,2.6 Z',
    intakeBody: 'M17,-5.2 L-8,-6.4 L-10,7.8 L14,7.8 Z',
    intake: 'M17,-5.2 L14,-5.4 L11,7.8 L14,7.8 Z',
    spine: 'M8,-8.2 C0,-10.6 -14,-10.6 -28,-8.6 L-28,-7 L8,-7 Z',
    canopy: 'M33,-4.9 C29,-11.2 16,-12.6 4,-8.8 C14,-7.8 24,-6.4 33,-4.9 Z',
    fin: 'M-12,-8.8 L-27,-24.4 L-35,-24.4 L-36,-8.4 Z',
    fin2: 'M-8,-8.9 L-22,-22 L-29,-22 L-31,-8.6 Z',
    wingNear: 'M12,4.6 L-14,14.6 L-22,14.6 L-29,5.4 Z',
    wingFar: 'M8,1.8 L-10,7.8 L-17,7.8 L-25,2.2 Z',
    tailplane: 'M-30,1.4 L-48,6 L-48,9.8 L-38,9.8 L-28,3.8 Z',
    panels: 'M-2,-8.6 L-4,7.8 M-20,-8.4 L-20,7.4 M-26,-16 L-34.4,-16',
    radomeX: 40,
  },
  // Twin-engine stealth air-dominance: diamond wing, big canted fins, caret intakes, vectoring nozzles.
  aurora: {
    fuselage:
      'M55,0.4 L44,-2.4 L30,-5.8 L15,-7.8 L-4,-8.6 L-34,-7.8 L-42,-5.4 L-45,-5 L-45,5 L-42,5.4 L-32,7.2 L10,7.8 L26,5.6 L41,2.6 Z',
    intakeBody: 'M18,-5.6 L-8,-6.6 L-10,7.6 L15,7.6 Z',
    intake: 'M18,-5.6 L14.6,-5.8 L11.6,7.6 L15,7.6 Z',
    spine: 'M6,-8 C-2,-10.4 -16,-10.4 -32,-8.2 L-32,-7 L6,-7 Z',
    canopy: 'M37,-4.6 C32,-12 17,-13 2,-8.6 C14,-7.8 26,-6.2 37,-4.6 Z',
    fin: 'M-14,-8.6 L-30,-26.4 L-38,-26.4 L-42,-7.8 Z',
    fin2: 'M-9,-8.7 L-24,-23.8 L-31,-23.8 L-35,-8.2 Z',
    wingNear: 'M14,4.6 L-20,15.4 L-27,15.4 L-33,5.6 Z',
    wingFar: 'M10,1.8 L-16,8.2 L-22,8.2 L-29,2.2 Z',
    tailplane: 'M-32,1.4 L-50,5.6 L-50,9.8 L-42,9.8 L-30,3.8 Z',
    panels: 'M-2,-8.4 L-4,7.6 M-22,-8.2 L-22,7.2 M-27,-17 L-36,-17',
    radomeX: 42,
    squareNozzle: true,
  },
};

interface Props {
  model?: JetId;
  paint?: Paint;
  /** 1 = gear fully down, 0 = retracted. */
  gear: number;
  /** 0–1+ flame strength; afterburner adds a long blue-white core. */
  flame: number;
  afterburner: boolean;
  flicker: number;
  contrail: number;
  vapour: number;
  smoke: number;
}

const OUT = '#1a212c';

/** Highest point (most negative y) of a path's coordinates. */
function finTop(d: string) {
  return Math.min(...[...d.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((m) => +m[1]));
}
/** Lowest point of the canopy, so it can be flattened onto the fuselage. */
function canopyBase(d: string) {
  return Math.max(...[...d.matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((m) => +m[1]));
}

export function Jet({ model = 'swift', paint = DEFAULT_PAINT, gear, flame, afterburner, flicker, contrail, vapour, smoke }: Props) {
  const g = GEOMETRY[model] ?? GEOMETRY.swift;
  const len = 6 + flame * 34 + (afterburner ? 26 : 0) + flicker * 4;
  const core = len * 0.55;
  return (
    <g>
      {contrail > 0 && <path d={`M-46,0 L${-46 - contrail},1.5 L${-46 - contrail},-1.5 Z`} fill="url(#contrail)" opacity={0.75} />}
      {vapour > 0 && (
        <g stroke="#ffffff" strokeWidth={1.2} strokeLinecap="round" opacity={vapour}>
          <line x1={-24} y1={9} x2={-24 - 70 * vapour} y2={10} />
          <line x1={-34} y1={-20} x2={-34 - 60 * vapour} y2={-19} />
        </g>
      )}
      {smoke > 0 && (
        <g fill="#8a8f99" opacity={smoke * 0.8}>
          <circle cx={-52 - (1 - smoke) * 20} cy={-2 - (1 - smoke) * 8} r={4 + (1 - smoke) * 6} />
          <circle cx={-62 - (1 - smoke) * 30} cy={1 - (1 - smoke) * 4} r={3 + (1 - smoke) * 5} />
        </g>
      )}
      {flame > 0.01 && (
        <g>
          <path d={`M-45,-4.5 Q${-45 - len * 0.6},-5 ${-45 - len},0 Q${-45 - len * 0.6},5 -45,4.5 Z`} fill="url(#flameOuter)" />
          <path d={`M-45,-2.5 Q${-45 - core * 0.6},-2.5 ${-45 - core},0 Q${-45 - core * 0.6},2.5 -45,2.5 Z`} fill={afterburner ? '#e9f4ff' : '#9fd3ff'} />
        </g>
      )}

      {/* landing gear (scaled from the belly) */}
      <g transform={`translate(0,6) scale(1,${gear}) translate(0,-6)`} opacity={gear > 0.05 ? 1 : 0}>
        <path d="M27,6 L26,15.2 M28.4,6 L26.6,10" stroke="#2a2f37" strokeWidth={1} />
        <circle cx={26} cy={15.2} r={2.5} fill="#1b1f26" stroke={OUT} strokeWidth={0.6} />
        <circle cx={26} cy={15.2} r={0.9} fill="#8b929c" />
        <path d="M-11,6 L-12,15 M-8,6 L-11.6,11" stroke="#2a2f37" strokeWidth={1.2} />
        <circle cx={-12} cy={15} r={2.8} fill="#1b1f26" stroke={OUT} strokeWidth={0.6} />
        <circle cx={-12} cy={15} r={1} fill="#8b929c" />
      </g>

      <path d={g.wingFar} fill={paint.body} stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />
      <path d={g.wingFar} fill="#000" opacity={0.35} />
      {g.fin2 && (
        <>
          <path d={g.fin2} fill={paint.body} stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />
          <path d={g.fin2} fill="#000" opacity={0.3} />
        </>
      )}
      <path d={g.fin} fill={paint.body} stroke={OUT} strokeWidth={0.5} strokeLinejoin="round" />
      <path d={g.fin} fill="url(#finShade)" />
      {/* squadron band across the top of the fin */}
      <clipPath id={`fintop-${model}`}>
        <rect x={-60} y={-40} width={60} height={finTop(g.fin) + 40 + 4.5} />
      </clipPath>
      <path d={g.fin} fill={paint.accent} clipPath={`url(#fintop-${model})`} />
      {g.tailplane && <path d={g.tailplane} fill={paint.body} stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />}
      {g.ventral && <path d={g.ventral} fill={paint.body} stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />}
      <path d={g.fuselage} fill={paint.body} stroke={OUT} strokeWidth={0.55} strokeLinejoin="round" />
      <path d={g.fuselage} fill="url(#bodyShade)" />
      <path d={g.spine} fill={paint.body} />
      <path d={g.spine.split(' L')[0]} fill="none" stroke={OUT} strokeWidth={0.5} />
      <path d={g.spine} fill="url(#spineShade)" />
      {/* radome */}
      <clipPath id={`nose-${model}`}>
        <rect x={g.radomeX} y={-20} width={30} height={40} />
      </clipPath>
      <path d={g.fuselage} fill="#5d6773" opacity={0.55} clipPath={`url(#nose-${model})`} />
      {g.intakeBody && <path d={g.intakeBody} fill={paint.body} stroke={OUT} strokeWidth={0.4} strokeLinejoin="round" />}
      {g.intakeBody && <path d={g.intakeBody} fill="url(#bodyShade)" opacity={0.7} />}
      {g.intake && <path d={g.intake} fill="#11161f" stroke={OUT} strokeWidth={0.4} strokeLinejoin="round" />}
      <path d={g.panels} fill="none" stroke={OUT} strokeWidth={0.35} opacity={0.45} />
      <g transform={`translate(0,${canopyBase(g.canopy)}) scale(1,0.82) translate(0,${-canopyBase(g.canopy)})`}>
        <path d={g.canopy} fill="url(#glass)" stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />
        <path d={g.canopy} fill="url(#glint)" />
      </g>
      {g.canard && <path d={g.canard} fill={paint.body} stroke={OUT} strokeWidth={0.45} strokeLinejoin="round" />}
      <path d={g.wingNear} fill={paint.body} stroke={OUT} strokeWidth={0.5} strokeLinejoin="round" />
      <path d={g.wingNear} fill="url(#wingShade)" />
      {g.wingTip && <path d={g.wingTip} fill="#d8dde3" stroke={OUT} strokeWidth={0.4} strokeLinejoin="round" />}
      {g.squareNozzle ? (
        <path d="M-41,-5.2 L-47,-4.4 L-47,4.4 L-41,5.2 Z" fill="#3a3f47" stroke={OUT} strokeWidth={0.45} />
      ) : (
        <path d="M-41,-4.8 L-47.5,-4 L-47.5,4 L-41,4.8 Z" fill="#4a4f57" stroke={OUT} strokeWidth={0.45} />
      )}
      <path d="M-43,-4.4 L-43,4.4 M-45,-4.2 L-45,4.2" stroke={OUT} strokeWidth={0.35} opacity={0.6} />
    </g>
  );
}

/** Stand-alone jet for menus and the hangar. */
export function JetIcon({ model, paint, width = 120 }: { model: JetId; paint: Paint; width?: number }) {
  return (
    <svg viewBox="-58 -30 116 50" width={width} height={(width * 50) / 116} aria-hidden="true">
      <defs>
        <JetDefs />
      </defs>
      <Jet model={model} paint={paint} gear={0} flame={0} afterburner={false} flicker={0} contrail={0} vapour={0} smoke={0} />
    </svg>
  );
}

export function JetDefs() {
  return (
    <>
      <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9fb6c9" />
        <stop offset="0.45" stopColor="#4c6378" />
        <stop offset="1" stopColor="#1d2733" />
      </linearGradient>
      <linearGradient id="glint" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0.2" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="bodyShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="0.35" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
      </linearGradient>
      <linearGradient id="spineShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="finShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000000" stopOpacity="0.2" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.15" />
      </linearGradient>
      <linearGradient id="wingShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0.25" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id="flameOuter" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#4fb6ff" />
        <stop offset="0.35" stopColor="#ffb347" />
        <stop offset="1" stopColor="#ff4d4d" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="contrail" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </>
  );
}
