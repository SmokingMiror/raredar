/** Six fighter jets drawn as pixel-art sprites, facing right; nozzle exit pinned to (-45, 0). */
export interface Paint {
  body: string;
  accent: string;
}

export const DEFAULT_PAINT: Paint = { body: '#b9c2cc', accent: '#3b82c4' };

export type JetId = 'swift' | 'kestrel' | 'stingray' | 'nightjar' | 'peregrine' | 'aurora';

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


/** Pixel-art sprites (public/img/sprite-N.png), 1 sprite pixel = 1 scene unit.
 *  nx/ny is the nozzle centre in sprite pixels; it is pinned to (-45, 0). */
const SPRITES: Record<JetId, { src: string; w: number; h: number; nx: number; ny: number }> = {
  swift: { src: '/img/sprite-1.png', w: 104, h: 42, nx: 0, ny: 24.5 },
  kestrel: { src: '/img/sprite-2.png', w: 104, h: 36, nx: 0, ny: 23 },
  stingray: { src: '/img/sprite-3.png', w: 104, h: 41, nx: 0, ny: 23 },
  nightjar: { src: '/img/sprite-4.png', w: 104, h: 49, nx: 2.5, ny: 26 },
  peregrine: { src: '/img/sprite-5.png', w: 104, h: 32, nx: 0, ny: 20.5 },
  aurora: { src: '/img/sprite-6.png', w: 104, h: 34, nx: 0, ny: 24.5 },
};

export function Jet({ model = 'swift', paint = DEFAULT_PAINT, gear, flame, afterburner, flicker, contrail, vapour, smoke }: Props) {
  const sp = SPRITES[model] ?? SPRITES.swift;
  const tintId = `tint-${model}-${paint.body.replace('#', '')}`;
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

      {/* landing gear (scaled from the belly), drawn behind the airframe */}
      <g transform={`translate(0,6) scale(1,${gear}) translate(0,-6)`} opacity={gear > 0.05 ? 1 : 0} shapeRendering="crispEdges">
        <rect x={25} y={4} width={2} height={10} fill="#2a2f37" />
        <rect x={23} y={13} width={6} height={5} fill="#1b1f26" />
        <rect x={25} y={14} width={2} height={2} fill="#8b929c" />
        <rect x={-13} y={4} width={2} height={10} fill="#2a2f37" />
        <rect x={-15} y={13} width={6} height={5} fill="#1b1f26" />
        <rect x={-13} y={14} width={2} height={2} fill="#8b929c" />
      </g>

      {/* pixel-art airframe, tinted towards the paint colour */}
      <filter id={tintId} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
        <feFlood floodColor={paint.body} result="paint" />
        <feBlend in="paint" in2="SourceGraphic" mode="color" result="tinted" />
        <feComposite in="tinted" in2="SourceGraphic" operator="in" result="clipped" />
        <feBlend in="clipped" in2="SourceGraphic" mode="normal" />
      </filter>
      <image
        href={sp.src}
        x={-45 - sp.nx}
        y={-sp.ny}
        width={sp.w}
        height={sp.h}
        filter={`url(#${tintId})`}
        style={{ imageRendering: 'pixelated' }}
        preserveAspectRatio="none"
      />
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
