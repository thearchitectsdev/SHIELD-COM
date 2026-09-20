import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------
 * SHIELD-COM Tactical Radio Audio Engine
 *
 * Real voiced transmissions + authentic VHF/UHF tactical radio sound effects:
 *   - Squelch open burst & key-up mic click
 *   - Pink-noise RF carrier + crackle impulse pops + flutter
 *   - Clear spoken tactical voice transmissions (5 selectable realistic comms)
 *   - Dynamic filtering: Raw Radio (heavy static/crackling) vs
 *     SHIELD-COM processed (noise floor suppressed, voice enhanced)
 *   - Two-tone roger beep (1050 Hz + 1580 Hz) and squelch close tail crash
 * ------------------------------------------------------------------ */

export interface RadioSentence {
  id: number;
  callsign: string;
  channel: string;
  title: string;
  text: string;
  band: "A" | "B";
}

export const RADIO_SENTENCES: RadioSentence[] = [
  {
    id: 1,
    callsign: "Sierra One",
    channel: "VHF 146.520",
    title: "SITREP & Comms Check",
    text: "Alpha Actual, this is Sierra One. SITREP: Objective secure, no casualties, marking LZ for extraction, over.",
    band: "A",
  },
  {
    id: 2,
    callsign: "Sierra One",
    channel: "UHF 446.000",
    title: "Rotor Noise & Filter Check",
    text: "Command, Sierra One. Heavy rotor and wind noise on extraction channel. Engaging Shield-Com inline filter. How copy, over?",
    band: "B",
  },
  {
    id: 3,
    callsign: "Command HQ",
    channel: "VHF 146.520",
    title: "Distress Beacon Intercept",
    text: "Break break, all callsigns. Emergency distress beacon detected on grid eight-two. Standing by for tactical relay, out.",
    band: "A",
  },
  {
    id: 4,
    callsign: "Command HQ",
    channel: "UHF 446.000",
    title: "Five-by-Five Copy",
    text: "Sierra One, Command copies five by five. Noise floor suppressed, voice clear and fully readable. Proceed to checkpoint Bravo, over.",
    band: "B",
  },
  {
    id: 5,
    callsign: "Sierra One",
    channel: "VHF 146.520",
    title: "Buffer Clip & Bird Visual",
    text: "Command, Sierra One. Marking tactical audio clip to local memory buffer. Extraction bird visual, popping amber smoke, out.",
    band: "A",
  },
];

/* -------------------------------- AudioContext -------------------------------- */
let ctx: AudioContext | null = null;

let master: GainNode;
let limiter: DynamicsCompressorNode;
let rawBus: GainNode;
let prcBus: GainNode;
let carrierGate: GainNode;
let crackleGain: GainNode;
let rumbleGain: GainNode;

/** tapped after the raw/processed crossfade — this is what the operator hears */
let meterTap: GainNode;
let analyser: AnalyserNode | null = null;
const WAVE_BINS = 128;
const FFT_BINS = 64;
const waveform = new Uint8Array(WAVE_BINS);
const spectrum = new Uint8Array(FFT_BINS);
/** smoothed level (0..1) for VU-style meters, readable every frame */
let level = 0;
let peakHold = 0;
let peakAt = 0;

let whiteBuffer: AudioBuffer | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

function updateVoiceCache() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}

if (typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined") {
  updateVoiceCache();
  window.speechSynthesis.onvoiceschanged = updateVoiceCache;
}

function getBestVoice(): SpeechSynthesisVoice | null {
  updateVoiceCache();
  if (!cachedVoices.length) return null;
  const en = cachedVoices.filter((v) => /^en/i.test(v.lang));
  const pool = en.length ? en : cachedVoices;
  const preferred = pool.find((v) =>
    /(david|daniel|mark|guy|george|alex|male|natural|google us english)/i.test(v.name),
  );
  return preferred || pool[0];
}

/* ----------------------------- Noise generation ----------------------------- */
function createPinkBuffer(seconds = 3): AudioBuffer {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (let i = 0; i < len; i++) d[i] /= peak * 1.05;
  return b;
}

function createCrackleBuffer(seconds = 2.4): AudioBuffer {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  const cracks = 64;
  for (let n = 0; n < cracks; n++) {
    const at = Math.floor(Math.random() * len);
    const amp = Math.random() > 0.8 ? 0.9 : 0.15 + Math.random() * 0.35;
    const decay = 30 + Math.random() * 320;
    for (let i = 0; i < decay * 3; i++) {
      if (at + i >= len) break;
      d[at + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / decay);
    }
  }
  return b;
}

function createWhiteNoiseBuffer(seconds = 1): AudioBuffer {
  const c = ctx!;
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function noiseBurst(t: number, dur = 0.18, gain = 0.45, hp = 300, lp = 4200) {
  if (!ctx || !whiteBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = whiteBuffer;
  const f1 = ctx.createBiquadFilter();
  f1.type = "highpass";
  f1.frequency.value = hp;
  const f2 = ctx.createBiquadFilter();
  f2.type = "lowpass";
  f2.frequency.value = lp;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(f1).connect(f2).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.04);
}

function playTone(freq: number, t: number, dur: number, gain = 0.15, type: OscillatorType = "sine") {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/* ------------------------------ Settings Store ------------------------------ */
export interface RadioAudioSettings {
  volume: number;
  squelch: number;
  noise: number;
  prc: number;
  processed: boolean;
  muted: boolean;
}

let settings: RadioAudioSettings = {
  volume: 0.55,
  squelch: 0.25,
  noise: 0.8,
  prc: 1.0,
  processed: true,
  muted: false,
};

const settingsListeners = new Set<() => void>();
const getSettings = () => settings;
export const getAudioSettings = getSettings;

export function setAudioSettings(patch: Partial<RadioAudioSettings>) {
  settings = { ...settings, ...patch };
  applySettings();
  settingsListeners.forEach((l) => l());
}

export function useAudioSettings(): RadioAudioSettings {
  return useSyncExternalStore(
    (l) => {
      settingsListeners.add(l);
      return () => settingsListeners.delete(l);
    },
    getSettings,
    getSettings,
  );
}

/** live level 0..1, smoothed — safe to poll from any animation loop */
export function getLevel() {
  return level;
}
/** decaying peak-hold level 0..1 */
export function getPeak() {
  return peakHold;
}
/** 128-sample time-domain waveform snapshot (the "wave") */
export function getWaveform(): Uint8Array {
  return waveform;
}
/** 64-bin frequency spectrum snapshot (0..255 per bin) */
export function getSpectrum(): Uint8Array {
  return spectrum;
}
/** true while a transmission is on air */
export const isTransmitting = () => currentTx;

function analyse() {
  if (!analyser) return;
  // time domain → waveform + RMS level
  const t = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(t);
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < WAVE_BINS; i++) {
    // stride across the buffer so 128 bins cover the whole window
    const v = t[Math.floor((i / WAVE_BINS) * t.length)];
    waveform[i] = v;
    const s = (v - 128) / 128;
    sum += s * s;
    peak = Math.max(peak, Math.abs(s));
  }
  const rms = Math.sqrt(sum / WAVE_BINS);
  level = level * 0.72 + Math.min(1, rms * 2.6) * 0.28;
  const now = performance.now();
  if (peak > peakHold || now - peakAt > 900) {
    peakHold = peak;
    peakAt = now;
  }
  analyser.getByteFrequencyData(spectrum);
}

function applySettings() {
  if (!ctx) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume * 0.45, now, 0.03);

  // Raw bus carries heavy static; PRC bus gates it heavily
  rawBus.gain.setTargetAtTime(settings.processed ? 0.0001 : 1, now, 0.02);
  prcBus.gain.setTargetAtTime(settings.processed ? 1 : 0.0001, now, 0.02);

  // Idle carrier level: when processed is active, noise drops down by 85%
  const noiseFactor = settings.processed ? 0.08 * (1 - settings.prc * 0.7) : 0.65;
  const idle = Math.max(0.001, (1 - settings.squelch) * noiseFactor * settings.noise);
  carrierGate.gain.setTargetAtTime(idle, now, 0.05);
  crackleGain.gain.setTargetAtTime(settings.processed ? 0.04 : (1 - settings.squelch) * 0.45 * settings.noise, now, 0.05);
  rumbleGain.gain.setTargetAtTime(settings.processed ? 0.005 : (1 - settings.squelch) * 0.15 * settings.noise, now, 0.05);
}

/* ------------------------------- Initialize Graph ------------------------------- */
export function initAudio() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AC();
  whiteBuffer = createWhiteNoiseBuffer(1);

  // Master limiter protecting speakers
  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 3;
  limiter.ratio.value = 16;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.08;

  master = ctx.createGain();
  master.connect(limiter);
  limiter.connect(ctx.destination);

  /* --- analysis tap: post bus-crossfade, pre-speaker, silent to the listener --- */
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.68;
  meterTap = ctx.createGain();
  meterTap.gain.value = 1;
  limiter.connect(meterTap).connect(analyser);

  // keep the analyser fed even while nothing is transmitting
  const pump = () => {
    analyse();
    requestAnimationFrame(pump);
  };
  requestAnimationFrame(pump);

  rawBus = ctx.createGain();
  prcBus = ctx.createGain();

  // Speaker cabinet bandpass
  const rawSpk = ctx.createBiquadFilter();
  rawSpk.type = "bandpass";
  rawSpk.frequency.value = 1800;
  rawSpk.Q.value = 0.8;
  rawBus.connect(rawSpk).connect(master);

  // SHIELD-COM processed speaker EQ (crisp clarity, presence lift)
  const prcHP = ctx.createBiquadFilter();
  prcHP.type = "highpass";
  prcHP.frequency.value = 320;
  const prcPresence = ctx.createBiquadFilter();
  prcPresence.type = "peaking";
  prcPresence.frequency.value = 2400;
  prcPresence.gain.value = 4.5;
  prcPresence.Q.value = 1.2;
  const prcLP = ctx.createBiquadFilter();
  prcLP.type = "lowpass";
  prcLP.frequency.value = 4200;
  prcBus.connect(prcHP).connect(prcPresence).connect(prcLP).connect(master);

  /* ---- Carrier Noise Bed ---- */
  carrierGate = ctx.createGain();
  carrierGate.connect(rawBus);
  carrierGate.connect(prcBus);

  const pink = ctx.createBufferSource();
  pink.buffer = createPinkBuffer(3);
  pink.loop = true;
  const pinkBP = ctx.createBiquadFilter();
  pinkBP.type = "bandpass";
  pinkBP.frequency.value = 1600;
  pinkBP.Q.value = 0.9;
  pink.connect(pinkBP).connect(carrierGate);
  pink.start();

  // Crackle impulse layer
  crackleGain = ctx.createGain();
  const crack = ctx.createBufferSource();
  crack.buffer = createCrackleBuffer(2.4);
  crack.loop = true;
  const crackHP = ctx.createBiquadFilter();
  crackHP.type = "highpass";
  crackHP.frequency.value = 800;
  crack.connect(crackHP).connect(crackleGain).connect(carrierGate);
  crack.start();

  // Low frequency hum
  rumbleGain = ctx.createGain();
  const brownLP = ctx.createBiquadFilter();
  brownLP.type = "lowpass";
  brownLP.frequency.value = 220;
  const humOsc = ctx.createOscillator();
  humOsc.type = "triangle";
  humOsc.frequency.value = 60;
  humOsc.connect(brownLP).connect(rumbleGain).connect(carrierGate);
  humOsc.start();

  applySettings();
}

/* ------------------------- Transmission State & API ------------------------- */
export interface TransmissionState {
  selectedIndex: number;
  isTransmitting: boolean;
  activeSentence: RadioSentence | null;
  transcript: string;
}

let txState: TransmissionState = {
  selectedIndex: 0,
  isTransmitting: false,
  activeSentence: null,
  transcript: "",
};

const txListeners = new Set<() => void>();
const getTxState = () => txState;
function emitTx() {
  txListeners.forEach((l) => l());
}

export function useTransmission(): TransmissionState & {
  sentences: RadioSentence[];
  setSentenceIndex: (index: number) => void;
  transmitSentence: (index?: number) => void;
  stopTransmission: () => void;
} {
  const s = useSyncExternalStore(
    (l) => {
      txListeners.add(l);
      return () => txListeners.delete(l);
    },
    getTxState,
    getTxState,
  );
  return {
    ...s,
    sentences: RADIO_SENTENCES,
    setSentenceIndex: (i: number) => {
      txState = { ...txState, selectedIndex: Math.max(0, Math.min(RADIO_SENTENCES.length - 1, i)) };
      emitTx();
    },
    transmitSentence,
    stopTransmission,
  };
}

let txTimeoutId: number | null = null;

export function stopTransmission() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (txTimeoutId) {
    window.clearTimeout(txTimeoutId);
    txTimeoutId = null;
  }
  if (txState.isTransmitting) {
    setPtt(false);
  }
}

/**
 * Transmits one of the 5 realistic radio sentences:
 * 1. Plays key-up chirp + squelch opening burst
 * 2. Unmutes carrier static (or gates it in SHIELD-COM mode)
 * 3. Speaks sentence with clear tactical military pacing
 * 4. On finish: fires two-tone roger beep + squelch tail snap
 */
export function transmitSentence(index?: number) {
  initAudio();
  const idx = typeof index === "number" ? index : txState.selectedIndex;
  const sentence = RADIO_SENTENCES[idx] || RADIO_SENTENCES[0];

  stopTransmission();

  txState = {
    ...txState,
    selectedIndex: idx,
    isTransmitting: true,
    activeSentence: sentence,
    transcript: sentence.text,
  };
  emitTx();

  setPtt(true, sentence.band);

  if (typeof window === "undefined" || !window.speechSynthesis) {
    // Fallback timer if TTS not supported
    txTimeoutId = window.setTimeout(() => {
      setPtt(false);
      txState = { ...txState, isTransmitting: false, activeSentence: null };
      emitTx();
    }, 3800);
    return;
  }

  // Ensure speech synthesis is awake and cancel any stuck speech
  window.speechSynthesis.cancel();
  if (window.speechSynthesis.paused) window.speechSynthesis.resume();

  const u = new SpeechSynthesisUtterance(sentence.text);
  u.rate = 1.05;
  u.pitch = 0.88;
  u.volume = settings.muted ? 0 : Math.min(1.0, settings.volume * 1.8);

  const voice = getBestVoice();
  if (voice) u.voice = voice;

  let ended = false;
  const onDone = () => {
    if (ended) return;
    ended = true;
    if (txTimeoutId) {
      window.clearTimeout(txTimeoutId);
      txTimeoutId = null;
    }
    // Small dwell before roger beep
    window.setTimeout(() => {
      setPtt(false);
      txState = {
        ...txState,
        isTransmitting: false,
        activeSentence: null,
        // Advance to next sentence automatically for next time
        selectedIndex: (idx + 1) % RADIO_SENTENCES.length,
      };
      emitTx();
    }, 240);
  };

  u.onend = onDone;
  u.onerror = onDone;

  // Safety fallback in case browser speech engine hangs
  const wordCount = sentence.text.split(" ").length;
  const maxWaitMs = Math.max(4500, wordCount * 580);
  txTimeoutId = window.setTimeout(onDone, maxWaitMs);

  // Delay actual speaking slightly so squelch opening burst is heard first
  window.setTimeout(() => {
    window.speechSynthesis.speak(u);
  }, 140);
}

/* ---------------------------------- PTT ---------------------------------- */
let currentTx = false;
export function isTx() {
  return currentTx;
}

export function setPtt(on: boolean, side: "A" | "B" = "A") {
  initAudio();
  if (!ctx || on === currentTx) return;
  currentTx = on;
  const t0 = ctx.currentTime;

  if (on) {
    // Tactical Key-up chirp (slight frequency difference per band)
    const baseChirp = side === "B" ? 2100 : 1920;
    playTone(baseChirp, t0, 0.04, 0.08, "square");
    playTone(baseChirp + 480, t0 + 0.04, 0.05, 0.12, "square");

    // Squelch opening crash burst
    noiseBurst(t0 + 0.02, 0.22, settings.processed ? 0.12 : 0.65 * settings.noise, 300, 4800);

    // Carrier level opens during transmission
    const txCarrier = settings.processed ? 0.06 * (1 - settings.prc * 0.8) : 0.75 * settings.noise;
    carrierGate.gain.cancelScheduledValues(t0);
    carrierGate.gain.setTargetAtTime(txCarrier, t0, 0.02);
  } else {
    // Key-down: Roger Beep (two-tone) + Squelch tail crash
    const t = ctx.currentTime;
    playTone(1050, t, 0.06, settings.processed ? 0.09 : 0.18, "sine");
    playTone(1580, t + 0.06, 0.07, settings.processed ? 0.09 : 0.18, "sine");

    // Tail snap
    noiseBurst(t + 0.03, 0.26, settings.processed ? 0.08 : 0.55 * settings.noise, 260, 4200);

    // Squelch closes back down
    applySettings();
  }
}

/* Quick UI blip for buttons */
export function blip(freq: number, dur = 0.05, vol = 0.15) {
  initAudio();
  if (!ctx) return;
  playTone(freq, ctx.currentTime, dur, vol, "sine");
}
