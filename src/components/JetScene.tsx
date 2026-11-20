import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TIERS } from '../game/config';
import { MAX_POINTS, TAKEOFF_POINTS, ZONES, isAirborne, mix, readout, skyColors, zoneFor } from '../game/flight';
import { mulberry32 } from '../game/daily';
import type { TierId } from '../game/types';
import { useReducedMotion } from '../hooks';
import { useLoadout } from '../settings';
import { Jet, JetDefs, type JetId, type Paint } from './Jet';

export interface SceneEffect {
  tier: TierId;
  /** Change this to replay the effect. */
  id: number;
}

interface Props {
  points: number;
  effect?: SceneEffect | null;
  afterburner?: boolean;
  hud?: boolean;
  banners?: boolean;
  paint?: Paint;
  jet?: JetId;
  className?: string;
}

const W = 400;
const SKY_BANDS = 16;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const wrap = (v: number, m: number) => ((v % m) + m) % m;
/** Vertical world pixels per point once airborne. */
const CLIMB_PX = 6;

const rand = mulberry32(7);
const CLOUDS = Array.from({ length: 34 }, () => ({
  alt: 70 + Math.pow(rand(), 0.8) * 1750,
  x: rand() * 560,
  s: 0.55 + rand() * 1.1,
  par: 0.35 + rand() * 0.8,
}));
const STARS = Array.from({ length: 70 }, () => ({ x: rand() * W, y: rand(), r: 0.4 + rand() * 1.1, ph: rand() * 6 }));
const LINES = Array.from({ length: 14 }, () => ({ x: rand() * 640, y: rand(), l: 0.5 + rand() }));
const HANGARS = [0, 150, 330].map((x, i) => ({ x, w: 90 + i * 14 }));

interface Frame {
  p: number;
  dist: number;
  t: number;
}

export function JetScene({ points, effect, afterburner = false, hud = true, banners = true, paint: paintProp, jet: jetProp, className }: Props) {
  const loadout = useLoadout();
  const paint = paintProp ?? loadout.paint;
  const jet = jetProp ?? loadout.jet;
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [H, setH] = useState(240);
  const [frame, setFrame] = useState<Frame>({ p: points, dist: 0, t: 0 });
  const [banner, setBanner] = useState<{ text: string; id: number } | null>(null);
  const target = useRef(points);
  const fx = useRef<{ tier: TierId; start: number } | null>(null);
  const live = useRef({ p: points, dist: 0, t: 0, zone: zoneFor(points).id as string });

  target.current = points;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0) setH(clamp((W * height) / width, 90, 900));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (effect) fx.current = { tier: effect.tier, start: live.current.t };
  }, [effect?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = live.current;
      s.t += dt;
      const gap = target.current - s.p;
      if (reduced) s.p = target.current;
      else if (Math.abs(gap) < 0.05) s.p = target.current;
      else s.p += Math.sign(gap) * Math.min(Math.abs(gap), Math.max(Math.abs(gap) * dt * 2.6, dt * 45));
      const groundSpeed = Math.min(s.p, TAKEOFF_POINTS) / TAKEOFF_POINTS;
      const speed = isAirborne(s.p) ? 260 : groundSpeed * 340;
      s.dist += (reduced ? speed * 0.3 : speed) * dt;
      const z = zoneFor(s.p).id;
      if (z !== s.zone) {
        const rising = ZONES.findIndex((x) => x.id === z) > ZONES.findIndex((x) => x.id === s.zone);
        if (rising && banners && z !== 'taxiway') setBanner({ text: zoneFor(s.p).banner, id: now });
        s.zone = z;
      }
      setFrame({ p: s.p, dist: s.dist, t: s.t });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, banners]);

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), 2200);
    return () => clearTimeout(id);
  }, [banner]);

  const { p, dist, t } = frame;

  // ---- effect envelope -------------------------------------------------
  const age = fx.current ? t - fx.current.start : 99;
  const tier = fx.current?.tier;
  const burst = tier ? TIERS[tier].thrust * clamp(1 - age / 2.2) : 0;
  const stall = tier === 'stall' ? clamp(1 - age / 1.6) : 0;
  const sonic = tier === 'sonic' && !reduced ? clamp(age / 0.9) : 1;
  const stealth = (tier === 'stealth' || tier === 'sonic') ? clamp(1 - age / 2.4) : 0;
  const shakeAmt = tier === 'sonic' && !reduced ? clamp(1 - age / 0.7) * 5 : 0;

  // ---- geometry ----------------------------------------------------------
  const groundY = H - 34;
  const jetGroundY = groundY - 17;
  const airAlt = Math.max(0, p - TAKEOFF_POINTS) * CLIMB_PX;
  const climbRoom = Math.max(0, jetGroundY - H * 0.44);
  const lift = Math.min(airAlt, climbRoom);
  const cam = Math.max(0, airAlt - climbRoom);
  const jetY = jetGroundY - lift + (isAirborne(p) && !reduced ? Math.sin(t * 1.3) * 1.5 : 0);
  const jetX = isAirborne(p) ? lerp(200, 222, clamp((p - 100) / 60)) : lerp(64, 200, clamp(p / TAKEOFF_POINTS));
  const rotate = clamp((p - 88) / 12) * -11 + clamp((p - 300) / 400) * 5;
  const wobble = stall * Math.sin(t * 22) * 5;
  const gear = clamp((108 - p) / 8);
  const contrail = isAirborne(p) ? 30 + clamp((p - 100) / 600) * 260 : 0;

  const [skyTop, skyBottom] = skyColors(p);
  const stars = clamp((p - 430) / 170);
  const earth = clamp((p - 560) / 90);
  const floor = clamp((p - 360) / 70) * (1 - 0.6 * clamp((p - 600) / 80));
  const groundSpeedLines = isAirborne(p) ? 0.25 : clamp(p / TAKEOFF_POINTS) * 0.35;
  const speedLines = reduced ? 0 : Math.max(groundSpeedLines, burst);

  const shake = shakeAmt ? `translate(${Math.sin(t * 90) * shakeAmt}px, ${Math.cos(t * 77) * shakeAmt}px)` : undefined;

  const zone = zoneFor(p);
  const label = readout(p);
  const tapeY = (pts: number) => lerp(H - 14, 14, clamp(pts / MAX_POINTS));

  const cloudFill = useMemo(() => (p < 100 ? '#f4d6c4' : '#ffffff'), [p < 100]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={box} className={`scene ${className ?? ''}`} role="img" aria-label={`Jet ${isAirborne(p) ? 'airborne at' : 'on the runway at'} ${label}, zone ${zone.name}`}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ transform: shake }}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {/* hard colour bands instead of a smooth fade, like a pixel-art sky */}
            {Array.from({ length: SKY_BANDS }, (_, i) => {
              const c = mix(skyTop, skyBottom, i / (SKY_BANDS - 1));
              return [
                <stop key={`a${i}`} offset={i / SKY_BANDS} stopColor={c} />,
                <stop key={`b${i}`} offset={(i + 1) / SKY_BANDS} stopColor={c} />,
              ];
            })}
          </linearGradient>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#ffe3b0" />
            <stop offset="0.34" stopColor="#ffe3b0" />
            <stop offset="0.34" stopColor="#ffb870" stopOpacity="0.7" />
            <stop offset="0.6" stopColor="#ffb870" stopOpacity="0.7" />
            <stop offset="0.6" stopColor="#ff8a4a" stopOpacity="0.3" />
            <stop offset="0.85" stopColor="#ff8a4a" stopOpacity="0.3" />
            <stop offset="0.85" stopColor="#ff8a4a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="earth" cx="0.5" cy="0" r="0.6">
            <stop offset="0" stopColor="#2f7fd0" />
            <stop offset="0.3" stopColor="#174a86" />
            <stop offset="1" stopColor="#0a1a33" />
          </radialGradient>
          <JetDefs />
        </defs>

        <rect width={W} height={H} fill="url(#sky)" />

        {/* stars */}
        {stars > 0 && (
          <g fill="#ffffff">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y * H * 0.85} r={s.r} opacity={stars * (0.55 + 0.45 * Math.sin(t * 2 + s.ph))} />
            ))}
          </g>
        )}

        {/* Earth's curve at the edge of space */}
        {earth > 0 && (
          <g opacity={earth}>
            <ellipse cx={W / 2} cy={H + 760 - 26 * earth} rx={1100} ry={780} fill="none" stroke="#6fc3ff" strokeWidth={8} opacity={0.45} />
            <ellipse cx={W / 2} cy={H + 760 - 26 * earth} rx={1100} ry={780} fill="url(#earth)" stroke="#9fe0ff" strokeWidth={1.2} />
          </g>
        )}

        {/* cloud floor far below in the stratosphere */}
        {floor > 0 && (
          <g opacity={floor}>
            {Array.from({ length: 9 }, (_, i) => {
              const x = wrap(i * 60 - dist * 0.12, 540) - 70;
              return <ellipse key={i} cx={x} cy={H - 4 + (i % 3) * 3} rx={52} ry={14} fill="#c9d8f0" opacity={0.5} />;
            })}
            <rect x={0} y={H - 6} width={W} height={6} fill="#c9d8f0" opacity={0.5} />
          </g>
        )}

        {/* low sun at dawn */}
        <circle cx={300} cy={groundY - 18 + cam} r={46} fill="url(#sun)" opacity={1 - clamp(p / 220)} />

        {/* clouds in world space */}
        <g fill={cloudFill}>
          {CLOUDS.map((c, i) => {
            const y = groundY - 30 - c.alt + cam;
            if (y < -40 || y > H + 40) return null;
            const x = wrap(c.x - dist * c.par * 0.6, 560) - 80;
            return (
              <g key={i} transform={`translate(${x},${y}) scale(${c.s})`} opacity={0.55 + c.par * 0.3}>
                <ellipse cx={0} cy={0} rx={28} ry={9} />
                <circle cx={-10} cy={-6} r={10} />
                <circle cx={6} cy={-9} r={12} />
                <circle cx={18} cy={-3} r={8} />
              </g>
            );
          })}
        </g>

        {/* ground layer, slides down as the camera climbs */}
        {cam < H + 60 && (
          <g transform={`translate(0,${cam})`}>
            {/* far ridge and near hills: two parallax layers, each tiled twice */}
            {[
              { par: 0.05, fill: '#4a4466', op: 0.45, pts: [0, 30, 50, 58, 110, 34, 170, 66, 240, 40, 300, 62, 360, 36, 400, 30] },
              { par: 0.14, fill: '#2f2b44', op: 0.75, pts: [0, 18, 60, 40, 120, 22, 190, 48, 270, 20, 340, 38, 400, 18] },
            ].map((layer, li) => {
              const off = -wrap(dist * layer.par, 400);
              const line = (dx: number) => layer.pts.reduce((acc, v, i) => acc + (i % 2 ? `,${groundY - v} ` : `L${v + dx}`), '');
              return (
                <path
                  key={li}
                  transform={`translate(${off},0)`}
                  d={`M0,${groundY} ${line(0)} ${line(400)} L800,${groundY} Z`}
                  fill={layer.fill}
                  opacity={layer.op}
                />
              );
            })}
            {HANGARS.map((h, i) => {
              const x = wrap(h.x - dist * 0.25, 520) - 100;
              return (
                <g key={i} transform={`translate(${x},${groundY})`}>
                  <path d={`M0,0 L0,-22 Q${h.w / 2},-40 ${h.w},-22 L${h.w},0 Z`} fill="#1a1f2b" />
                  <rect x={h.w * 0.2} y={-14} width={h.w * 0.6} height={14} fill="#ffb347" opacity={0.28} />
                </g>
              );
            })}
            <g transform={`translate(${wrap(250 - dist * 0.25, 520) - 100},${groundY})`}>
              <rect x={0} y={-52} width={8} height={52} fill="#1a1f2b" />
              <path d="M-8,-52 L16,-52 L13,-62 L-5,-62 Z" fill="#232a39" />
              <rect x={-4} y={-60} width={16} height={5} fill="#6cff8f" opacity={0.5} />
            </g>
            <rect x={0} y={groundY} width={W} height={H - groundY + 4} fill="#1c212b" />
            <rect x={0} y={groundY} width={W} height={2} fill="#4a5162" />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={wrap(i * 40 - dist, 480) - 40} y={groundY + 14} width={22} height={2.5} fill="#e9e6da" opacity={0.85} />
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <circle key={i} cx={wrap(i * 30 - dist, 480) - 40} cy={groundY + 3} r={1.4} fill="#ffd27a" />
            ))}
            <rect x={0} y={groundY + 28} width={W} height={60} fill="#151922" />
            {/* foreground grass tufts move fastest */}
            <g fill="#25331f">
              {Array.from({ length: 10 }, (_, i) => {
                const x = wrap(i * 53 - dist * 1.5, 530) - 60;
                return <path key={i} d={`M${x},${groundY + 34} l3,-7 l2,7 l3,-9 l2,9 l3,-6 l2,6 Z`} />;
              })}
            </g>
          </g>
        )}

        {/* heat haze behind the jet on the take-off roll */}
        {!reduced && !isAirborne(p) && p > 20 && (
          <g fill="none" stroke="#ffffff" strokeWidth={1.2} opacity={0.12 * clamp((p - 20) / 60)}>
            {[0, 1, 2].map((i) => {
              const y = groundY - 8 - i * 6;
              const x0 = jetX - 140;
              const ph = t * 9 + i * 2;
              return <path key={i} d={`M${x0},${y} q12,${Math.sin(ph) * 3} 24,0 t24,0 t24,0 t24,0`} />;
            })}
          </g>
        )}

        {/* speed lines */}
        {speedLines > 0.02 && (
          <g stroke="#ffffff" strokeLinecap="round">
            {LINES.map((l, i) => {
              const x = wrap(l.x - dist * 2.4, 640) - 120;
              const len = (20 + 70 * speedLines) * l.l;
              return <line key={i} x1={x} y1={l.y * H} x2={x + len} y2={l.y * H} strokeWidth={1} opacity={speedLines * 0.45} />;
            })}
          </g>
        )}

        {/* the jet */}
        <g transform={`translate(${jetX},${jetY}) rotate(${rotate + wobble})`}>
          <Jet
            model={jet}
            paint={paint}
            gear={gear}
            flame={stall > 0 ? 0.05 * (1 - stall) : 0.12 + burst * 1.2}
            afterburner={afterburner || (tier === 'sonic' && age < 2.5)}
            flicker={reduced ? 0 : Math.sin(t * 40) * 0.5 + 0.5}
            contrail={contrail}
            vapour={reduced ? 0 : stealth}
            smoke={stall}
          />
        </g>

        {/* sonic boom shockwave ring */}
        {sonic < 1 && (
          <circle cx={jetX} cy={jetY} r={14 + sonic * 240} fill="none" stroke="#ffffff" strokeWidth={4 * (1 - sonic) + 0.5} opacity={1 - sonic} />
        )}
        {tier === 'sonic' && !reduced && age < 0.25 && <rect width={W} height={H} fill="#ffffff" opacity={0.35 * (1 - age / 0.25)} />}

        {/* HUD */}
        {hud && (
          <g className="hud" fill="none" stroke="#6cff8f" strokeWidth={1}>
            <path d="M10,22 L10,10 L22,10 M122,10 L134,10 L134,22 M10,40 L10,52 L22,52 M134,40 L134,52 L122,52" opacity={0.85} />
            <text x={18} y={36} className="hud-readout" stroke="none" fill="#6cff8f">
              {label}
            </text>
            <text x={18} y={48} className="hud-zone" stroke="none" fill="#cfe9d6">
              {zone.name.toUpperCase()}
            </text>
            <line x1={W - 12} y1={14} x2={W - 12} y2={H - 14} opacity={0.6} />
            {[0, 20, 100, 400, 600, 700].map((z) => (
              <g key={z}>
                <line x1={W - 18} y1={tapeY(z)} x2={W - 12} y2={tapeY(z)} />
                <text x={W - 21} y={tapeY(z) + 3} className="hud-tick" textAnchor="end" stroke="none" fill="#cfe9d6">
                  {z === 0 ? '0' : z === 20 ? '' : z === 100 ? 'T/O' : `${(z - 100) / 10}K`}
                </text>
              </g>
            ))}
            {Array.from({ length: 13 }, (_, i) => (i + 1) * 50).map((z) => (
              <line key={z} x1={W - 15} y1={tapeY(z)} x2={W - 12} y2={tapeY(z)} opacity={0.5} />
            ))}
            <path d={`M${W - 11},${tapeY(p)} l7,-4 l0,8 Z`} fill="#6cff8f" stroke="none" />
            {afterburner && (
              <g opacity={reduced ? 1 : 0.65 + 0.35 * Math.sin(t * 8)}>
                <rect x={10} y={58} width={66} height={13} fill="#ffb347" stroke="none" />
                <text x={43} y={68} textAnchor="middle" className="hud-zone" stroke="none" fill="#1a0f00" fontWeight="bold">
                  AFTERBURNER
                </text>
              </g>
            )}
          </g>
        )}
      </svg>
      {banner && (
        <div key={banner.id} className="scene-banner" aria-hidden="true">
          {banner.text}
        </div>
      )}
    </div>
  );
}
