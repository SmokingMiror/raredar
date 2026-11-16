/** Six original fictional jets, side view facing right, centred on (0,0).
 *  Placeholder SVG until real art exists. Nozzle sits at x≈-45 on every model. */
export interface Paint {
  body: string;
  accent: string;
}

export const DEFAULT_PAINT: Paint = { body: '#d5dde8', accent: '#3b82c4' };

export type JetId = 'swift' | 'kestrel' | 'stingray' | 'nightjar' | 'peregrine' | 'aurora';

interface Geometry {
  fuselage: string;
  canopy: string;
  fin: string;
  /** Optional second (far) fin, drawn in the accent colour. */
  fin2?: string;
  finStripe?: string;
  wingNear: string;
  wingTip?: string;
  wingFar: string;
  tailplane?: string;
  canard?: string;
  /** Horizontal stabiliser on top of the fin (T-tail). */
  tTail?: string;
}

const GEOMETRY: Record<JetId, Geometry> = {
  swift: {
    fuselage: 'M46,0 C34,-3.5 18,-7 0,-7 L-34,-6 L-42,-4.5 L-45,-4.5 L-45,4.5 L-42,4.5 L-34,6 L0,6 C18,6 34,3 46,0 Z',
    canopy: 'M6,-6.6 C11,-14 23,-12.5 30,-3.6 C22,-5.5 14,-6.6 6,-6.6 Z',
    fin: 'M-24,-5 L-37,-22 L-30,-22.5 L-12,-5.5 Z',
    finStripe: 'M-31,-14 L-35.5,-20.5 L-31.5,-20.8 L-26,-14 Z',
    wingNear: 'M12,3 L-20,4.5 L-30,12 L-26,12.5 L-2,7 Z',
    wingTip: 'M-22,10 L-29,12.2 L-26,12.4 L-20,10.6 Z',
    wingFar: 'M8,1 L-24,2 L-30,6 L-4,4 Z',
    tailplane: 'M-30,2.5 L-44,8 L-39,8.5 L-26,4 Z',
  },
  kestrel: {
    fuselage: 'M40,0 C30,-4 16,-7.5 0,-7.5 L-36,-6.5 L-42,-5 L-45,-5 L-45,5 L-42,5 L-34,6.5 L0,6.5 C16,6.5 30,3.5 40,0 Z',
    canopy: 'M4,-7 C8,-13.5 18,-12.5 24,-4.5 C17,-6.2 10,-7 4,-7 Z',
    fin: 'M-22,-6 L-40,-24 L-34,-24.5 L-10,-6.5 Z',
    finStripe: 'M-31,-15 L-37,-21.5 L-33.5,-21.8 L-26,-15 Z',
    wingNear: 'M6,3.5 L-24,4.5 L-36,11.5 L-30,12 L-6,7 Z',
    wingTip: 'M-27,10 L-35,11.6 L-31,11.9 L-24,10.6 Z',
    wingFar: 'M2,1 L-26,2 L-32,5.5 L-8,4 Z',
    canard: 'M24,2 L13,3 L8,6.5 L19,4.6 Z',
  },
  stingray: {
    fuselage: 'M44,0 C34,-3 22,-6 6,-8 C-10,-9 -30,-8 -40,-6 L-45,-4.5 L-45,4.5 L-40,6 C-28,8 -8,8 6,7 C22,5.5 34,3 44,0 Z',
    canopy: 'M8,-7.8 C13,-13.5 22,-11.5 27,-4.8 C20,-6.3 14,-7.3 8,-7.8 Z',
    fin: 'M-28,-7 L-37,-20 L-31,-20.5 L-18,-7.5 Z',
    fin2: 'M-21,-7.8 L-30,-18.5 L-25.5,-18.8 L-13,-8.2 Z',
    wingNear: 'M18,3 L-30,5 L-40,13 L-34,13.4 L-6,8 Z',
    wingTip: 'M-33,11.4 L-39,12.9 L-35,13.2 L-29,11.9 Z',
    wingFar: 'M12,1 L-30,2 L-37,6 L-8,4 Z',
  },
  nightjar: {
    fuselage: 'M46,0 L30,-4 L12,-7 L-10,-7.5 L-36,-6 L-45,-4 L-45,4 L-36,6 L-10,6.5 L12,6 L30,3 Z',
    canopy: 'M8,-7 L14,-12.5 L24,-10.5 L30,-4 Z',
    fin: 'M-24,-6.5 L-38,-21 L-32.5,-22 L-14,-7 Z',
    fin2: 'M-17,-7 L-31,-19 L-27,-19.6 L-9,-7.3 Z',
    wingNear: 'M10,3.5 L-22,5 L-35,12.5 L-27,13 L-4,7 Z',
    wingTip: 'M-29,11.3 L-34.5,12.6 L-28.5,12.8 L-24,11.5 Z',
    wingFar: 'M6,1 L-26,2 L-34,6 L-6,4 Z',
    tailplane: 'M-32,2.5 L-46,8.5 L-40,9 L-28,4 Z',
  },
  peregrine: {
    fuselage: 'M54,0 C40,-2.5 22,-6 2,-6.5 L-34,-6 L-42,-4.5 L-45,-4.5 L-45,4.5 L-42,4.5 L-34,5.5 L2,5.5 C22,5.5 40,2.5 54,0 Z',
    canopy: 'M0,-6.3 C6,-13 18,-12 24,-4.5 C16,-5.8 8,-6.3 0,-6.3 Z',
    fin: 'M-26,-5.5 L-35,-21 L-29,-21.5 L-16,-6 Z',
    finStripe: 'M-30,-13 L-33.8,-19.4 L-30,-19.7 L-26.2,-13 Z',
    tTail: 'M-27,-21.5 L-41,-22.5 L-38,-24.5 L-26,-23.5 Z',
    wingNear: 'M8,3 L-18,4.5 L-31,10.5 L-26,11 L-2,6.5 Z',
    wingTip: 'M-24,9.4 L-30,10.6 L-26.5,10.9 L-21,9.8 Z',
    wingFar: 'M4,1 L-20,2 L-28,5 L-6,3.5 Z',
  },
  aurora: {
    fuselage: 'M48,0 C36,-3.5 20,-7 0,-7 L-36,-6 L-42,-4.5 L-45,-4.5 L-45,4.5 L-42,4.5 L-34,6 L0,6 C20,6 36,3 48,0 Z',
    canopy: 'M8,-6.6 C13,-14 25,-12.5 32,-3.6 C24,-5.5 16,-6.6 8,-6.6 Z',
    fin: 'M-25,-5 L-35,-21 L-29,-21.5 L-13,-5.5 Z',
    finStripe: 'M-29.5,-13 L-33.5,-19.3 L-29.8,-19.6 L-25.5,-13 Z',
    wingNear: 'M-18,3.5 L4,5 L12,12.5 L7,12.8 L-24,7 Z',
    wingTip: 'M6,10.6 L11.5,12.4 L7.5,12.6 L3.5,11 Z',
    wingFar: 'M-16,1 L2,2 L9,6 L-20,4 Z',
    canard: 'M30,1.5 L19,2.5 L15,5.8 L25,4 Z',
    tailplane: 'M-31,2.5 L-45,8 L-40,8.5 L-27,4 Z',
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

const OUT = '#0b111c';

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
        <rect x={25} y={5} width={2} height={9} fill={OUT} />
        <circle cx={26} cy={14.5} r={3.2} fill="#1e2532" stroke={OUT} strokeWidth={1} />
        <rect x={-13} y={5} width={2.4} height={9} fill={OUT} />
        <circle cx={-12} cy={14} r={3.8} fill="#1e2532" stroke={OUT} strokeWidth={1} />
      </g>

      <path d={g.wingFar} fill={paint.body} stroke={OUT} strokeWidth={1.2} opacity={0.7} />
      {g.fin2 && <path d={g.fin2} fill={paint.accent} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" />}
      <path d={g.fin} fill={paint.body} stroke={OUT} strokeWidth={1.6} strokeLinejoin="round" />
      {g.finStripe && <path d={g.finStripe} fill={paint.accent} />}
      {g.tTail && <path d={g.tTail} fill={paint.accent} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" />}
      <path d={g.fuselage} fill={paint.body} stroke={OUT} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M36,0.6 C26,1.6 14,2.6 0,2.6 L-38,2.6 L-38,0.6 L0,0.6 C14,0.6 26,0.2 36,0.6 Z" fill={paint.accent} />
      <path d="M6,-1 L-8,-1 L-8,4 L4,4 Z" fill="#2a3242" stroke={OUT} strokeWidth={1} />
      <path d={g.canopy} fill="url(#glass)" stroke={OUT} strokeWidth={1.4} strokeLinejoin="round" />
      {g.canard && <path d={g.canard} fill={paint.body} stroke={OUT} strokeWidth={1.3} strokeLinejoin="round" />}
      <path d={g.wingNear} fill={paint.body} stroke={OUT} strokeWidth={1.6} strokeLinejoin="round" />
      {g.wingTip && <path d={g.wingTip} fill={paint.accent} />}
      {g.tailplane && <path d={g.tailplane} fill={paint.body} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" />}
      <rect x={-48} y={-4} width={4} height={8} rx={1} fill="#3a4252" stroke={OUT} strokeWidth={1.2} />
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
        <stop offset="0" stopColor="#bfe9ff" />
        <stop offset="1" stopColor="#2d6fa8" />
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
