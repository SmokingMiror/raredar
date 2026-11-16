export { useReducedMotion } from './settings';
import { useEffect, useState } from 'react';

/** Tracks the visual viewport height so the layout can shrink above a mobile keyboard. */
export function useViewportHeightVar() {
  useEffect(() => {
    const vv = window.visualViewport;
    const set = () => document.documentElement.style.setProperty('--vvh', `${vv ? vv.height : window.innerHeight}px`);
    set();
    vv?.addEventListener('resize', set);
    window.addEventListener('resize', set);
    return () => {
      vv?.removeEventListener('resize', set);
      window.removeEventListener('resize', set);
    };
  }, []);
}

/** Counts from the previous value up to `to` over `ms`. */
export function useCountUp(to: number, ms = 900, from = 0): number {
  const [v, setV] = useState(from);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, from]);
  return v;
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
