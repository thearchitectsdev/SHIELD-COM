import { useSyncExternalStore } from "react";
import { getDevice, markPress, radioHold, radioKey, radioPower, radioToggle, setDevice, sosHold, sosToggle } from "./device";

/* ------------------------------------------------------------------ *
 * SCRIPTED FIELD DEMO
 *
 * Plays a short operator scenario through the SAME device store that the
 * 3D model and the 2D demo deck are wired to, so every step is visible
 * on the walkie-talkie (LCD, TX LED, knob), on SHIELD-COM (light-pipes,
 * SOS cap glow, MARK travel) and on every readout at once.
 * ------------------------------------------------------------------ */

export interface DemoStep {
  /** short label for the step list */
  title: string;
  /** narration shown in the caption bar */
  caption: string;
  /** which part the camera should frame (null = default assembled view) */
  focus: string | null;
  /** dwell time in ms before the next step */
  ms: number;
  /** side effects on the device store */
  run?: () => void;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    title: "Host radio on",
    caption: "The operator's own walkie-talkie powers up. SHIELD-COM has no power switch — its PWR indication is already steady.",
    focus: "host-radio",
    ms: 2600,
    run: () => {
      if (!getDevice().radio.power) radioPower();
    },
  },
  {
    title: "PTT keyed · voice transmission",
    caption: "PTT is keyed on the host radio. Real voice transmission: 'Alpha Actual, this is Sierra One. SITREP: Objective secure, marking LZ for extraction, over.' SHIELD-COM's PRC indicator accelerates.",
    focus: "host-radio",
    ms: 4800,
    run: () => radioHold("ptt", true),
  },
  {
    title: "PTT released",
    caption: "Transmission complete — two-tone roger beep and squelch tail snap as the carrier clamps shut. Pipeline returns to idle breathing.",
    focus: "host-radio",
    ms: 2000,
    run: () => radioHold("ptt", false),
  },
  {
    title: "SOS held",
    caption: "On SHIELD-COM the operator holds the guarded red SOS control. The red indicator ramps while the 1.2 s hold is counted.",
    focus: "sos-control",
    ms: 1500,
    run: () => {
      if (getDevice().sosActive) sosToggle();
      sosHold(true);
      window.setTimeout(() => {
        if (!getDevice().sosHoldStart) return;
        sosToggle();
        sosHold(false);
      }, 1250);
    },
  },
  {
    title: "SOS event raised",
    caption: "Hold complete — an emergency event is raised in the embedded controller and SOS blinks at a hard 4 Hz. Nothing was transmitted by SHIELD-COM: the RF path is still the radio's.",
    focus: "led-pipes",
    ms: 3200,
  },
  {
    title: "MARK tapped",
    caption: "A short press on the ridged MARK control freezes the pre- and post-event audio buffer to flash. The amber indicator bursts to confirm.",
    focus: "mark-control",
    ms: 2400,
    run: () => markPress(),
  },
  {
    title: "Second clip",
    caption: "A second MARK tags another clip. The amber indicator settles to a slow 'clips stored' blink between bursts.",
    focus: "mark-control",
    ms: 2400,
    run: () => markPress(),
  },
  {
    title: "Radio menu",
    caption: "Back on the host radio: MENU, ▲ and a squelch value are keyed — the LCD tracks every press. SHIELD-COM never enters this chain.",
    focus: "host-radio",
    ms: 3000,
    run: () => {
      radioKey("MENU");
      window.setTimeout(() => radioKey("UP"), 700);
      window.setTimeout(() => radioKey("UP"), 1300);
      window.setTimeout(() => radioKey("EXIT"), 2300);
    },
  },
  {
    title: "Torch + SOS cleared",
    caption: "Torch on for the walk out. SOS is held again for 1.2 s to clear the event — the red indicator returns to dark and armed.",
    focus: "sos-control",
    ms: 2600,
    run: () => {
      if (!getDevice().radio.torch) radioToggle("torch");
      sosHold(true);
      window.setTimeout(() => {
        if (!getDevice().sosHoldStart) return;
        sosToggle();
        sosHold(false);
      }, 1250);
    },
  },
  {
    title: "Your turn",
    caption: "Demo complete. Every control you just watched is live — click the radio keys, hold SOS, tap MARK, turn the knob.",
    focus: null,
    ms: 2600,
    run: () => {
      if (getDevice().radio.torch) radioToggle("torch");
    },
  },
];

/* ------------------------------ store ------------------------------ */
export interface DemoState {
  running: boolean;
  step: number; // -1 when idle
  startedAt: number;
  stepStartedAt: number;
}

let demo: DemoState = { running: false, step: -1, startedAt: 0, stepStartedAt: 0 };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const get = () => demo;
export const useDemo = () => useSyncExternalStore(subscribe, get, get);
export const getDemo = get;

let timer: number | null = null;
let token = 0;

/** asks the viewer to frame a part (or the default view) without scrolling */
function focus(part: string | null) {
  window.dispatchEvent(new CustomEvent("shieldcom:demo-focus", { detail: { part } }));
}

function runStep(i: number, my: number) {
  if (my !== token) return;
  if (i >= DEMO_STEPS.length) {
    stopDemo(true);
    return;
  }
  const s = DEMO_STEPS[i];
  demo = { ...demo, step: i, stepStartedAt: performance.now() };
  emit();
  focus(s.focus);
  try {
    s.run?.();
  } catch {
    /* keep the script going */
  }
  timer = window.setTimeout(() => runStep(i + 1, my), s.ms);
}

export function startDemo() {
  stopDemo(false);
  token += 1;
  // make sure the scenario starts from a clean, known state
  const d = getDevice();
  if (d.radio.ptt) radioHold("ptt", false);
  if (d.radio.monitor) radioHold("monitor", false);
  if (d.radio.menu !== null) radioKey("EXIT");
  setDevice({ sosHoldStart: 0 });
  demo = { running: true, step: -1, startedAt: performance.now(), stepStartedAt: performance.now() };
  emit();
  window.dispatchEvent(new CustomEvent("shieldcom:demo-start"));
  runStep(0, token);
}

export function stopDemo(finished = false) {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
  token += 1;
  const wasRunning = demo.running;
  // release anything the script may be holding
  const d = getDevice();
  if (d.radio.ptt) radioHold("ptt", false);
  if (d.sosHoldStart) sosHold(false);
  demo = { running: false, step: -1, startedAt: 0, stepStartedAt: 0 };
  emit();
  if (wasRunning && !finished) focus(null);
  if (finished) focus(null);
}
