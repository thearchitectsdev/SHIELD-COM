import { useSyncExternalStore } from "react";
import { blip, initAudio, setPtt, stopTransmission, transmitSentence } from "./audio";

/* ------------------------------------------------------------------ *
 * Live device state shared between the 3D model and the HUD.
 * Small hand-rolled store: no re-render storms, readable from useFrame.
 * ------------------------------------------------------------------ */

export const MENU_ITEMS = [
  "SQL", "STEP", "TXP", "SAVE", "VOX", "W/N", "ABR", "TDR", "BEEP", "TOT",
  "R-DCS", "R-CTCS", "T-DCS", "T-CTCS", "VOICE", "ANI-ID", "DTMFST", "S-CODE", "SC-REV", "PTT-ID",
];
export const MENU_VALUES = [
  "3", "25.0K", "HIGH", "1:1", "OFF", "WIDE", "5", "ON", "ON", "60",
  "OFF", "67.0", "OFF", "67.0", "ENG", "80808", "OFF", "1", "TO", "OFF",
];

export type Band = "A" | "B";

export interface RadioState {
  power: boolean;
  volume: number;
  band: Band;
  mode: "VFO" | "MR";
  freqA: number;
  freqB: number;
  chA: number;
  chB: number;
  ptt: boolean;
  monitor: boolean;
  torch: boolean;
  alarm: boolean;
  scan: boolean;
  keylock: boolean;
  menu: number | null;
  entry: string;
  lastKey: string;
  lastKeyAt: number;
}

export interface DeviceState {
  sosActive: boolean;
  sosHoldStart: number;
  markAt: number;
  markCount: number;
  radio: RadioState;
}

let state: DeviceState = {
  sosActive: false,
  sosHoldStart: 0,
  markAt: 0,
  markCount: 0,
  radio: {
    power: true,
    volume: 6,
    band: "A",
    mode: "VFO",
    freqA: 146.52,
    freqB: 446.0,
    chA: 8,
    chB: 18,
    ptt: false,
    monitor: false,
    torch: false,
    alarm: false,
    scan: false,
    keylock: false,
    menu: null,
    entry: "",
    lastKey: "",
    lastKeyAt: 0,
  },
};

/* ------------------------------ audio ------------------------------ */
let actx: AudioContext | null = null;
function beep(freq: number, dur = 0.06, vol = 0.05, type: OscillatorType = "square", when = 0) {
  try {
    actx ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (actx.state === "suspended") void actx.resume();
    const t0 = actx.currentTime + when;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  } catch {
    /* audio unavailable */
  }
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const getDevice = () => state;

export function setDevice(patch: Partial<DeviceState>) {
  state = { ...state, ...patch };
  emit();
}

export function setRadio(patch: Partial<RadioState>) {
  state = { ...state, radio: { ...state.radio, ...patch } };
  emit();
}

export function useDevice(): DeviceState {
  return useSyncExternalStore(subscribe, getDevice, getDevice);
}

/* ------------------------------ radio ------------------------------ */
const STEP = 0.025;
const clampF = (f: number) => Math.min(520, Math.max(136, Math.round(f * 1000) / 1000));

export function radioKey(key: string) {
  const r = state.radio;
  const now = performance.now();
  if (!r.power) return;
  if (r.keylock && key !== "#") {
    beep(360, 0.09, 0.04); // rejected — keypad locked
    setRadio({ lastKey: key, lastKeyAt: now });
    return;
  }
  beep(1240, 0.05);
  const patch: Partial<RadioState> = { lastKey: key, lastKeyAt: now };
  const fKey: "freqA" | "freqB" = r.band === "A" ? "freqA" : "freqB";
  const cKey: "chA" | "chB" = r.band === "A" ? "chA" : "chB";

  switch (key) {
    case "MENU":
      patch.menu = r.menu === null ? 0 : r.menu;
      patch.entry = "";
      break;
    case "EXIT":
      patch.menu = null;
      patch.entry = "";
      break;
    case "UP":
      if (r.menu !== null) patch.menu = (r.menu + 1) % MENU_ITEMS.length;
      else if (r.mode === "VFO") patch[fKey] = clampF(r[fKey] + STEP);
      else patch[cKey] = (r[cKey] % 128) + 1;
      patch.entry = "";
      break;
    case "DOWN":
      if (r.menu !== null) patch.menu = (r.menu + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
      else if (r.mode === "VFO") patch[fKey] = clampF(r[fKey] - STEP);
      else patch[cKey] = r[cKey] <= 1 ? 128 : r[cKey] - 1;
      patch.entry = "";
      break;
    case "*":
      patch.scan = !r.scan;
      break;
    case "#":
      patch.keylock = !r.keylock;
      patch.entry = "";
      break;
    default:
      if (/^\d$/.test(key)) {
        if (r.menu !== null) {
          const e = (r.entry + key).slice(-2);
          const n = parseInt(e, 10);
          patch.entry = e;
          if (n < MENU_ITEMS.length) patch.menu = n;
        } else {
          const e = r.entry + key;
          if (e.length >= 6) {
            const f = parseInt(e, 10) / 1000;
            if (f >= 136 && f <= 520) patch[fKey] = f;
            patch.entry = "";
          } else {
            patch.entry = e;
          }
        }
      }
  }
  setRadio(patch);
}

export function radioPower() {
  const r = state.radio;
  if (!r.power) {
    // power-on chime
    beep(880, 0.07, 0.05);
    beep(1320, 0.09, 0.05, "square", 0.09);
  } else {
    beep(520, 0.1, 0.045);
  }
  setRadio({ power: !r.power, ptt: false, monitor: false, menu: null, entry: "", scan: false, alarm: false });
}
export function radioToggle(k: "torch" | "alarm") {
  if (k === "alarm" && !state.radio.power) return;
  const next = !state.radio[k];
  if (k === "torch") beep(1900, 0.025, 0.03);
  if (k === "alarm" && next) {
    beep(950, 0.12, 0.05, "sawtooth");
    beep(1450, 0.12, 0.05, "sawtooth", 0.13);
    // alarm warble over the radio audio
    initAudio();
    blip(950, 0.14, 0.25);
  }
  setRadio({ [k]: next } as Partial<RadioState>);
}
export function radioHold(k: "ptt" | "monitor", v: boolean) {
  if (!state.radio.power && v) return;
  if (state.radio[k] === v) return;
  if (k === "ptt") {
    if (v) {
      initAudio();
      transmitSentence();
    } else {
      stopTransmission();
      setPtt(false);
    }
  }
  if (k === "monitor" && v) beep(700, 0.05, 0.03);
  setRadio({ [k]: v } as Partial<RadioState>);
}
export function radioAB() {
  if (!state.radio.power) return;
  beep(1240, 0.05);
  setRadio({ band: state.radio.band === "A" ? "B" : "A", entry: "" });
}
export function radioVfoMr() {
  if (!state.radio.power) return;
  beep(1240, 0.05);
  setRadio({ mode: state.radio.mode === "VFO" ? "MR" : "VFO", entry: "", menu: null });
}
export function radioBand() {
  const r = state.radio;
  if (!r.power) return;
  beep(1240, 0.05);
  const fKey: "freqA" | "freqB" = r.band === "A" ? "freqA" : "freqB";
  setRadio({ [fKey]: r[fKey] < 300 ? 446.0 : 146.52, entry: "" } as Partial<RadioState>);
}

/* ---------------------------- shield-com --------------------------- */
export function sosHold(down: boolean) {
  if (down) beep(1600, 0.04, 0.03, "sine");
  setDevice({ sosHoldStart: down ? performance.now() : 0 });
}
export function sosToggle() {
  const raising = !state.sosActive;
  if (raising) {
    beep(900, 0.09, 0.05, "sine");
    beep(1200, 0.09, 0.05, "sine", 0.1);
    beep(1600, 0.14, 0.055, "sine", 0.2);
  } else {
    beep(1200, 0.08, 0.04, "sine");
    beep(800, 0.12, 0.04, "sine", 0.09);
  }
  setDevice({ sosActive: raising, sosHoldStart: 0 });
}
export function markPress() {
  beep(1750, 0.04, 0.035, "sine");
  beep(1750, 0.04, 0.035, "sine", 0.07);
  blip(1760, 0.06, 0.2);
  setDevice({ markAt: performance.now(), markCount: state.markCount + 1 });
}

export const fmtFreq = (f: number) => f.toFixed(3);

/* ------------------------- shared indication ----------------------- */
export const SOS_HOLD_MS = 1200;

export const LED_DEFS: { key: string; color: string }[] = [
  { key: "PWR", color: "#5cff9d" },
  { key: "PRC", color: "#4fd1e0" },
  { key: "SOS", color: "#ff4b3e" },
  { key: "MRK", color: "#ffb02e" },
];

/**
 * Live status behaviour, shared by the 3D light-pipes and the 2D demo deck:
 * 0 PWR  steady
 * 1 PRC  breathing; fast + bright while the host radio is keyed (audio active)
 * 2 SOS  dark while armed → ramps during the hold → hard 4 Hz blink once raised
 * 3 MRK  dark → rapid confirm burst for 3 s after a press → slow "clip stored" blink
 */
export function ledLevel(i: number, t: number) {
  const d = state;
  const now = performance.now();
  switch (i) {
    case 0:
      return 0.85 + Math.sin(t * 0.7) * 0.05;
    case 1: {
      const keyed = d.radio.ptt || d.radio.monitor;
      const rate = keyed ? 7 : 1.9;
      return (keyed ? 0.5 : 0.28) + Math.pow(Math.max(0, Math.sin(t * rate)), 2.2) * 0.95;
    }
    case 2:
      if (d.sosActive) return (t * 4) % 1 < 0.5 ? 1 : 0.05;
      if (d.sosHoldStart) return 0.06 + Math.min(1, (now - d.sosHoldStart) / SOS_HOLD_MS) * 0.9;
      return 0.06;
    default: {
      if (d.markAt) {
        const age = now - d.markAt;
        if (age < 3000) return (age / 1000) % 0.25 < 0.12 ? 1 : 0.08;
      }
      if (d.markCount > 0) {
        const c = (t * 0.45) % 1;
        return c < 0.12 ? 1.0 : 0.09;
      }
      return 0.05;
    }
  }
}

/** progress of an in-flight SOS hold, 0..1 */
export const sosHoldProgress = () => (state.sosHoldStart ? Math.min(1, (performance.now() - state.sosHoldStart) / SOS_HOLD_MS) : 0);
