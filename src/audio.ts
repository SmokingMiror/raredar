/**
 * All game sound is synthesised with Web Audio — no audio files to load.
 * Sound is off by default; a click on a sound toggle (a user gesture) unlocks the AudioContext.
 */
import type { TierId } from './game/types';
import type { ZoneId } from './game/flight';

type Ctx = AudioContext;

const CHORDS: Record<ZoneId, number[]> = {
  // root-position-ish voicings in Hz; darker on the ground, opening up with altitude
  taxiway: [73.42, 110.0, 146.83, 174.61], // D minor
  roll: [82.41, 123.47, 164.81, 196.0], // E minor
  climb: [98.0, 146.83, 196.0, 246.94], // G major
  strato: [110.0, 164.81, 220.0, 293.66], // A sus4
  space: [130.81, 196.0, 261.63, 392.0], // C open fifths
};

class AudioEngine {
  private ctx: Ctx | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private musicBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private soundOn = false;
  private musicOn = false;

  private engine: { oscs: OscillatorNode[]; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private burner: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private pad: { oscs: OscillatorNode[]; gain: GainNode; zone: ZoneId } | null = null;
  private zone: ZoneId = 'taxiway';
  private points = 0;
  private engineWanted = false;
  private burnerWanted = false;

  /** Call from a click handler so browsers allow audio to start. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate * 2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.apply();
  }

  configure({ sound, music }: { sound: boolean; music: boolean }) {
    this.soundOn = sound;
    this.musicOn = music;
    this.apply();
  }

  private get live() {
    return !!this.ctx && this.ctx.state !== 'closed';
  }

  private apply() {
    if (!this.live) return;
    const t = this.ctx!.currentTime;
    this.sfx.gain.setTargetAtTime(this.soundOn ? 1 : 0, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.22 : 0, t, 0.4);
    if (this.soundOn && this.engineWanted) this.startEngine();
    if (!this.soundOn || !this.engineWanted) this.stopEngine();
    this.setAfterburner(this.burnerWanted);
    if (this.musicOn) this.setZone(this.zone, true);
  }

  // ---- continuous layers --------------------------------------------------
  engineOn() {
    this.engineWanted = true;
    this.apply();
  }
  engineOff() {
    this.engineWanted = false;
    this.burnerWanted = false;
    this.apply();
  }

  private startEngine() {
    if (this.engine || !this.live) return;
    const c = this.ctx!;
    const gain = c.createGain();
    gain.gain.value = 0;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.connect(gain).connect(this.sfx);
    const oscs = [0, 7].map((detune, i) => {
      const o = c.createOscillator();
      o.type = i ? 'triangle' : 'sawtooth';
      o.detune.value = detune;
      o.connect(filter);
      o.start();
      return o;
    });
    this.engine = { oscs, filter, gain };
    gain.gain.setTargetAtTime(0.05, c.currentTime, 0.3);
    this.setPoints(this.points);
  }

  private stopEngine() {
    if (!this.engine || !this.live) return;
    const { oscs, gain } = this.engine;
    const t = this.ctx!.currentTime;
    gain.gain.setTargetAtTime(0, t, 0.15);
    oscs.forEach((o) => o.stop(t + 0.6));
    this.engine = null;
  }

  /** Engine pitch rises with points; ramps over about the scene's tween time. */
  setPoints(points: number) {
    this.points = points;
    if (!this.engine || !this.live) return;
    const t = this.ctx!.currentTime;
    const f = 48 + Math.min(points, 760) * 0.16;
    this.engine.oscs.forEach((o) => o.frequency.setTargetAtTime(f, t, 0.5));
    this.engine.filter.frequency.setTargetAtTime(380 + Math.min(points, 760) * 2.2, t, 0.5);
  }

  setAfterburner(on: boolean) {
    this.burnerWanted = on;
    if (!this.live) return;
    const c = this.ctx!;
    const want = on && this.soundOn && this.engineWanted;
    if (want && !this.burner) {
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 650;
      bp.Q.value = 0.6;
      const gain = c.createGain();
      gain.gain.value = 0;
      src.connect(bp).connect(gain).connect(this.sfx);
      src.start();
      gain.gain.setTargetAtTime(0.09, c.currentTime, 0.25);
      this.burner = { src, gain };
    } else if (!want && this.burner) {
      const { src, gain } = this.burner;
      gain.gain.setTargetAtTime(0, c.currentTime, 0.3);
      src.stop(c.currentTime + 1.2);
      this.burner = null;
    }
  }

  // ---- music: one pad per flight zone, crossfaded -----------------------
  setZone(zone: ZoneId, force = false) {
    if (zone === this.zone && this.pad && !force) return;
    this.zone = zone;
    if (!this.live || !this.musicOn) return;
    if (this.pad && this.pad.zone === zone) return;
    const c = this.ctx!;
    const t = c.currentTime;
    if (this.pad) {
      const old = this.pad;
      old.gain.gain.setTargetAtTime(0, t, 0.8);
      old.oscs.forEach((o) => o.stop(t + 4));
    }
    const gain = c.createGain();
    gain.gain.value = 0;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = zone === 'space' ? 2400 : 1200;
    lp.connect(gain).connect(this.musicBus);
    const oscs = CHORDS[zone].flatMap((f, i) =>
      [-6, 6].map((detune) => {
        const o = c.createOscillator();
        o.type = i === 0 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(lp);
        o.start();
        return o;
      }),
    );
    gain.gain.setTargetAtTime(0.12, t, 1.2);
    this.pad = { oscs, gain, zone };
  }

  // ---- one-shots ----------------------------------------------------------
  private noise(dur: number, filterType: BiquadFilterType, freq: number, vol: number, q = 1, at = 0) {
    if (!this.live || !this.soundOn) return;
    const c = this.ctx!;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
    return f;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, endFreq?: number, at = 0) {
    if (!this.live || !this.soundOn) return;
    const c = this.ctx!;
    const t = c.currentTime + at;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Soft key click while typing. */
  click() {
    this.tone(2400 + Math.random() * 400, 0.025, 'square', 0.012);
  }

  /** Radio crackle + squelch before a tower line. */
  radio() {
    this.tone(1250, 0.07, 'sine', 0.05);
    for (let i = 0; i < 6; i++) this.noise(0.05 + Math.random() * 0.05, 'bandpass', 1800 + Math.random() * 1500, 0.07, 3, 0.05 + i * 0.07);
    this.tone(1250, 0.06, 'sine', 0.04, undefined, 0.5);
  }

  /** Wrong answer: short double buzz. */
  wrong() {
    this.tone(150, 0.12, 'square', 0.05);
    this.tone(120, 0.14, 'square', 0.05, undefined, 0.14);
  }

  /** Last five seconds. */
  tick() {
    this.tone(880, 0.05, 'sine', 0.05);
  }

  /** Thrust whoosh scaled by tier; sonic boom gets a thump; stall gets a sputter. */
  tier(tier: TierId) {
    if (tier === 'stall') {
      for (let i = 0; i < 4; i++) this.noise(0.09, 'lowpass', 300, 0.25, 1, i * 0.16);
      this.tone(90, 0.5, 'sawtooth', 0.05, 40);
      return;
    }
    const k = { rookie: 0.25, showboat: 0.3, wingman: 0.5, ace: 0.7, stealth: 0.85, sonic: 1 }[tier];
    const f = this.noise(0.5 + k * 0.9, 'bandpass', 300, 0.12 + k * 0.25, 0.8);
    if (f && this.ctx) f.frequency.exponentialRampToValueAtTime(900 + k * 2200, this.ctx.currentTime + 0.4 + k * 0.6);
    if (tier === 'sonic') this.boom();
  }

  boom() {
    this.tone(70, 0.9, 'sine', 0.5, 28);
    this.noise(0.7, 'lowpass', 180, 0.6, 0.7);
  }

  /** Take-off fanfare: rising fifth. */
  airborne() {
    this.tone(392, 0.25, 'triangle', 0.06);
    this.tone(587.33, 0.45, 'triangle', 0.06, undefined, 0.18);
  }
}

export const audio = new AudioEngine();
