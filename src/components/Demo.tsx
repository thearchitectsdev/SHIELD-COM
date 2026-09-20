import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/Sections";
import { requestViewer } from "@/components/Viewer";
import {
  LED_DEFS,
  MENU_ITEMS,
  MENU_VALUES,
  SOS_HOLD_MS,
  fmtFreq,
  getDevice,
  ledLevel,
  markPress,
  radioAB,
  radioBand,
  radioHold,
  radioKey,
  radioPower,
  radioToggle,
  radioVfoMr,
  sosHold,
  sosHoldProgress,
  sosToggle,
  useDevice,
} from "@/three/device";
import { DEMO_STEPS, startDemo, stopDemo, useDemo } from "@/three/demo";
import {
  RADIO_SENTENCES,
  getAudioSettings,
  initAudio,
  setAudioSettings,
  useAudioSettings,
  useTransmission,
} from "@/three/audio";
import { CompareWaves, MiniWave, SpectrumBars, VuMeter } from "@/components/Waveforms";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------ *
 * INTERACTIVE DEMO DECK
 * A flat, glove-sized mirror of both devices. Everything here writes to
 * the same store as the 3D model, so a press on this page moves the 3D
 * radio's keys, lights the light-pipes and updates every readout.
 * ------------------------------------------------------------------ */

/* ----------------------------- LED strip ----------------------------- */
function LedStrip({ size = 14 }: { size?: number }) {
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < LED_DEFS.length; i++) {
        const el = dots.current[i];
        if (!el) continue;
        const v = ledLevel(i, t);
        el.style.opacity = String(0.18 + v * 0.82);
        el.style.boxShadow = `0 0 ${4 + v * 14}px ${LED_DEFS[i].color}${v > 0.5 ? "" : "88"}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="flex items-center gap-4">
      {LED_DEFS.map((l, i) => (
        <div key={l.key} className="flex flex-col items-center gap-1.5">
          <span
            ref={(el) => {
              dots.current[i] = el;
            }}
            className="rounded-full"
            style={{ width: size, height: size, background: l.color }}
          />
          <span className="font-mono text-[9px] tracking-[0.2em] text-graphite-500">{l.key}</span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- SOS hold button -------------------------- */
function SosButton() {
  const d = useDevice();
  const ring = useRef<SVGCircleElement>(null);
  const holding = useRef(false);
  const fired = useRef(false);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = holding.current ? sosHoldProgress() : 0;
      if (ring.current) ring.current.style.strokeDashoffset = String(283 * (1 - p));
      if (holding.current && p >= 1 && !fired.current) {
        fired.current = true;
        sosToggle();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const down = () => {
    holding.current = true;
    fired.current = false;
    sosHold(true);
  };
  const up = () => {
    if (!holding.current) return;
    holding.current = false;
    sosHold(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#ff4b3e" strokeOpacity="0.15" strokeWidth="3" />
          <circle ref={ring} cx="50" cy="50" r="45" fill="none" stroke="#ff4b3e" strokeWidth="3" strokeDasharray="283" strokeDashoffset="283" />
        </svg>
        <button
          onPointerDown={down}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "relative h-24 w-28 select-none rounded-md border-4 font-mono text-[15px] tracking-[0.3em] text-white transition-transform active:translate-y-0.5",
            d.sosActive ? "border-alert bg-alert shadow-[0_0_28px_rgba(216,69,60,0.6)] sos-blink" : "border-[#7a2a22] bg-[#b5342a] shadow-[inset_0_-6px_0_rgba(0,0,0,0.35)]",
          )}
          style={{ touchAction: "none" }}
        >
          SOS
        </button>
      </div>
      <span className="font-mono text-[10px] tracking-widest text-graphite-500">{d.sosActive ? "HOLD 1.2 s TO CLEAR" : "HOLD 1.2 s"}</span>
    </div>
  );
}

function MarkButton() {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onPointerDown={() => {
          setPressed(true);
          markPress();
          window.setTimeout(() => setPressed(false), 140);
        }}
        className={cn(
          "h-16 w-16 select-none rounded-full border-4 border-[#2c3323] bg-[#454f36] font-mono text-[10px] tracking-[0.25em] text-graphite-100 transition-transform",
          pressed ? "translate-y-0.5 shadow-none" : "shadow-[inset_0_-5px_0_rgba(0,0,0,0.4)]",
        )}
        style={{ backgroundImage: "repeating-conic-gradient(from 0deg, #4d5a3d 0 12deg, #3c4630 12deg 24deg)" }}
      >
        <span className="rounded-sm bg-[#454f36]/90 px-1 py-0.5">MARK</span>
      </button>
      <span className="font-mono text-[10px] tracking-widest text-graphite-500">SHORT PRESS</span>
    </div>
  );
}

/* --------------------------- host radio LCD --------------------------- */
function RadioLcd() {
  const d = useDevice();
  const r = d.radio;
  if (!r.power) {
    return (
      <div className="flex h-[118px] items-center justify-center rounded-sm border border-graphite-700 bg-[#0a1220] font-mono text-[11px] tracking-[0.3em] text-graphite-600">
        DISPLAY OFF
      </div>
    );
  }
  const row = (band: "A" | "B") => {
    const act = r.band === band;
    const f = band === "A" ? r.freqA : r.freqB;
    const ch = band === "A" ? r.chA : r.chB;
    const editing = act && r.entry.length > 0 && r.menu === null;
    const txt = editing ? `${r.entry.slice(0, 3)}.${r.entry.slice(3)}`.padEnd(7, "_") : r.mode === "MR" ? `CH-${String(ch).padStart(3, "0")}` : fmtFreq(f);
    return (
      <div className={cn("flex items-baseline gap-2", act ? "text-[#eaf4ff]" : "text-[#8fb3e6]/45")}>
        <span className="font-mono text-[11px]">{act ? "▶" : " "}</span>
        <span className="font-mono text-[11px]">{band}</span>
        <span className="font-mono text-[26px] font-bold leading-none tracking-wider">{txt}</span>
        <span className="ml-auto font-mono text-[10px]">CH {String(ch).padStart(2, "0")}</span>
      </div>
    );
  };
  return (
    <div className="relative h-[118px] overflow-hidden rounded-sm border border-[#0d2a5c] bg-gradient-to-b from-[#0e3b86] via-[#1557b0] to-[#0a2f6e] px-3 py-2 shadow-[inset_0_0_30px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px)", backgroundSize: "100% 3px" }} />
      <div className="flex items-center gap-2 font-mono text-[9px] tracking-widest text-[#eaf4ff]/85">
        <span>TALL</span>
        <span>LOS</span>
        <span className={r.mode === "VFO" ? "" : "opacity-30"}>VOX</span>
        {r.keylock && <span>🔒</span>}
        {r.scan && <span className="animate-pulse">SCAN</span>}
        <span className="ml-auto">{r.ptt ? <span className="rounded-sm bg-[#ff5a46] px-1 text-white">TX</span> : r.monitor ? <span className="rounded-sm bg-[#7dffbe] px-1 text-[#04231a]">BUSY</span> : <span className="opacity-60">RX</span>}</span>
        <span>▮▮▮</span>
      </div>
      {r.menu !== null ? (
        <div className="mt-2 rounded-sm border border-[#eaf4ff]/40 bg-[#04122e]/80 px-3 py-2">
          <div className="font-mono text-[9px] tracking-widest text-[#8fb3e6]">
            MENU {String(r.menu + 1).padStart(2, "0")} / {MENU_ITEMS.length}
          </div>
          <div className="mt-0.5 flex items-baseline justify-between font-mono text-[#eaf4ff]">
            <span className="text-[20px] font-bold">{MENU_ITEMS[r.menu]}</span>
            <span className="text-[14px]">{MENU_VALUES[r.menu]}</span>
          </div>
        </div>
      ) : (
        <div className="mt-1.5 space-y-1">
          {row("A")}
          {row("B")}
        </div>
      )}
      <div className="absolute inset-x-3 bottom-1.5 flex items-center gap-2 font-mono text-[9px] tracking-widest text-[#8fb3e6]">
        <span>VOL</span>
        <span className="flex gap-px">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={cn("h-2 w-1", i < r.volume ? "bg-[#eaf4ff]" : "bg-[#eaf4ff]/20")} />
          ))}
        </span>
        <span className="ml-auto">{r.mode}</span>
        {r.alarm && <span className="animate-pulse text-[#ff9c8c]">ALARM</span>}
        {r.torch && <span>TORCH</span>}
      </div>
    </div>
  );
}

/* ------------------------------ key caps ------------------------------ */
function Key({ main, sub, onDown, onUp, className, hold }: { main: string; sub?: string; onDown: () => void; onUp?: () => void; className?: string; hold?: boolean }) {
  const [down, setDown] = useState(false);
  return (
    <button
      onPointerDown={() => {
        setDown(true);
        onDown();
      }}
      onPointerUp={() => {
        setDown(false);
        onUp?.();
      }}
      onPointerLeave={() => {
        if (down) {
          setDown(false);
          onUp?.();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      title={hold ? "Press and hold" : undefined}
      className={cn(
        "flex select-none flex-col items-center justify-center rounded-sm border border-graphite-700 bg-graphite-950 px-2 py-1.5 font-mono transition-all",
        down ? "translate-y-px border-graphite-500 bg-graphite-800" : "shadow-[inset_0_-3px_0_rgba(0,0,0,0.5)] hover:border-graphite-500",
        className,
      )}
      style={{ touchAction: "none" }}
    >
      <span className="text-[13px] font-bold leading-none text-graphite-100">{main}</span>
      {sub && <span className="mt-1 text-[8px] tracking-[0.15em] text-graphite-500">{sub}</span>}
    </button>
  );
}

const KEYS: [string, string][] = [
  ["MENU", ""],
  ["▲", ""],
  ["▼", ""],
  ["EXIT", ""],
  ["1", "STEP"],
  ["2", "TXP"],
  ["3", "SAVE"],
  ["*", "SCAN"],
  ["4", "VOX"],
  ["5", "W/N"],
  ["6", "ABR"],
  ["0", "SQL"],
  ["7", "TDR"],
  ["8", "BEEP"],
  ["9", "TOT"],
  ["#", "LOCK"],
];
const keyId = (k: string) => (k === "▲" ? "UP" : k === "▼" ? "DOWN" : k);

/* ------------------------------ the deck ------------------------------ */
function ShieldComDeck() {
  const d = useDevice();
  return (
    <div className="relative overflow-hidden rounded-sm border border-graphite-700 bg-gradient-to-b from-[#2b3031] to-[#1c2021] p-5">
      <span className="absolute inset-x-0 top-0 h-px bg-amber-glow/60" />
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[15px] tracking-[0.3em] text-graphite-100">SHIELD-COM</div>
          <div className="mono-label mt-0.5 text-graphite-500">MOD-SC1 · inline module · live mirror</div>
        </div>
        <LedStrip />
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-center gap-10 rounded-sm border border-black/40 bg-black/25 px-6 py-6">
        <SosButton />
        <MarkButton />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700">
        {[
          ["SOS event", d.sosActive ? "RAISED" : d.sosHoldStart ? "ARMING…" : "Armed"],
          ["Clips stored", String(d.markCount)],
          ["Audio path", d.radio.ptt || d.radio.monitor ? "LIVE" : "Idle"],
        ].map(([k, v]) => (
          <div key={k} className="bg-graphite-950/80 px-3 py-2">
            <div className="mono-label text-graphite-500">{k}</div>
            <div className={cn("mt-0.5 font-mono text-[12px]", v === "RAISED" ? "text-alert" : v === "LIVE" ? "text-cyan-tech" : "text-graphite-200")}>{v}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-graphite-500">
        No power switch, no volume, no PTT, no channel control on this body — only these two controls and four indicators. Hold SOS for {SOS_HOLD_MS / 1000} s; tap MARK.
      </p>
    </div>
  );
}

function RadioDeck() {
  const d = useDevice();
  const r = d.radio;
  return (
    <div className="relative overflow-hidden rounded-sm border border-graphite-700 bg-gradient-to-b from-[#1e2124] to-[#131517] p-5">
      <span className="absolute inset-x-0 top-0 h-px bg-cyan-tech/60" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[15px] tracking-[0.3em] text-graphite-100">HOST RADIO</div>
          <div className="mono-label mt-0.5 text-graphite-500">Dual-band handheld · context only · not supplied</div>
        </div>
        <div className="flex items-center gap-1.5">
          <Key main="⏻" sub={r.power ? "ON" : "OFF"} onDown={radioPower} className={cn("w-14", r.power && "border-cyan-tech/50")} />
          <Key main="🔦" sub="TORCH" onDown={() => radioToggle("torch")} className={cn("w-14", r.torch && "border-amber-glow/60")} />
        </div>
      </div>

      <div className="mt-4">
        <RadioLcd />
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
        {/* left flank: PTT / CALL / MONI */}
        <div className="flex w-[74px] flex-col gap-1.5">
          <Key main="PTT" sub="HOLD" hold onDown={() => radioHold("ptt", true)} onUp={() => radioHold("ptt", false)} className={cn("h-[74px]", r.ptt && "border-alert/70 bg-alert/15")} />
          <Key main="CALL" sub="ALARM" onDown={() => radioToggle("alarm")} className={cn("border-[#8a3a12] bg-[#c2410c]/80", r.alarm && "animate-pulse")} />
          <Key main="MONI" sub="HOLD" hold onDown={() => radioHold("monitor", true)} onUp={() => radioHold("monitor", false)} className={cn(r.monitor && "border-cyan-tech/60 bg-cyan-tech/10")} />
        </div>
        {/* face: mode row + keypad */}
        <div>
          <div className="grid grid-cols-3 gap-1.5">
            <Key main="VFO/MR" onDown={radioVfoMr} className="border-[#8a3a12] bg-[#c2410c]/80" />
            <Key main="A/B" onDown={radioAB} className="border-[#0e7490] bg-[#0e7490]/70" />
            <Key main="BAND" onDown={radioBand} />
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {KEYS.map(([k, s]) => (
              <Key key={k} main={k} sub={s} onDown={() => radioKey(keyId(k))} className={cn(k === "#" && r.keylock && "border-amber-glow/60", k === "*" && r.scan && "border-cyan-tech/60")} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-graphite-500">
        Everything here is the radio's own behaviour. SHIELD-COM sits on the accessory audio path — it never touches RF, tuning or menus.
      </p>
    </div>
  );
}

/* ---------------------------- audio panel ---------------------------- */
function Slider({ label, value, min = 0, max = 1, onChange, unit = "" }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label className="flex items-center gap-3">
      <span className="mono-label w-20 shrink-0 text-graphite-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider flex-1 accent-amber-glow"
      />
      <span className="w-12 shrink-0 text-right font-mono text-[10px] text-graphite-300">
        {unit ? `${Math.round(value * 100)}${unit}` : value.toFixed(2)}
      </span>
    </label>
  );
}

function AudioPanel() {
  const a = useAudioSettings();
  void getAudioSettings;
  const d = useDevice();
  const tx = useTransmission();

  return (
    <div className="rounded-sm border border-graphite-700 bg-graphite-900/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="mono-label text-amber-glow">Tactical radio link · live voice transmission</span>
            {tx.isTransmitting && (
              <span className="flex items-center gap-1.5 rounded-sm bg-alert/20 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-alert">
                <span className="h-1.5 w-1.5 rounded-full bg-alert animate-ping" />
                TRANSMITTING LIVE
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-graphite-400">
            Listen to 5 realistic tactical voice transmissions. Toggle between <span className="text-graphite-200 font-medium">Raw radio</span> (authentic heavy RF static & crackle) and <span className="text-cyan-tech font-medium">SHIELD-COM</span> (noise floor suppressed, voice crisp & five-by-five).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              initAudio();
              setAudioSettings({ muted: !a.muted });
            }}
            className={cn(
              "mono-label rounded-sm border px-3 py-2 transition-colors",
              a.muted ? "border-graphite-600 text-graphite-400" : "border-amber-glow/60 bg-amber-glow/15 text-amber-glow",
            )}
          >
            {a.muted ? "🔇 Unmute" : "🔊 Sound ON"}
          </button>
          <button
            onClick={() => {
              initAudio();
              if (!d.radio.power) radioPower();
              setAudioSettings({ muted: false });
              if (tx.isTransmitting) {
                tx.stopTransmission();
              } else {
                tx.transmitSentence();
              }
            }}
            className={cn(
              "mono-label rounded-sm border px-3.5 py-2 font-bold transition-all",
              tx.isTransmitting
                ? "border-alert bg-alert text-white shadow-[0_0_15px_rgba(216,69,60,0.5)]"
                : "border-alert/60 bg-alert/15 text-alert hover:bg-alert/25",
            )}
          >
            {tx.isTransmitting ? "■ Stop PTT" : "▶ Transmit current"}
          </button>
        </div>
      </div>

      {/* 5 Distinct Tactical Radio Sentences */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="mono-label text-graphite-400">5 Tactical Comms Presets · Click to transmit sentence:</span>
          <span className="mono-label text-graphite-500 hidden sm:inline">Active: #{tx.selectedIndex + 1}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {RADIO_SENTENCES.map((s, idx) => {
            const isPlayingThis = tx.isTransmitting && tx.activeSentence?.id === s.id;
            const isSelected = tx.selectedIndex === idx;
            return (
              <div
                key={s.id}
                onClick={() => {
                  initAudio();
                  if (!d.radio.power) radioPower();
                  setAudioSettings({ muted: false });
                  tx.setSentenceIndex(idx);
                  tx.transmitSentence(idx);
                }}
                className={cn(
                  "cursor-pointer rounded-sm border p-3 transition-all flex flex-col justify-between text-left",
                  isPlayingThis
                    ? "border-alert bg-alert/15 shadow-[0_0_20px_rgba(216,69,60,0.25)]"
                    : isSelected
                      ? "border-cyan-tech/60 bg-cyan-tech/[0.08]"
                      : "border-graphite-700 bg-graphite-950/70 hover:border-graphite-500 hover:bg-graphite-900/90",
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-amber-glow">0{s.id} · {s.callsign}</span>
                    <span className="font-mono text-[9px] text-graphite-500 rounded bg-graphite-800 px-1 py-0.5">{s.channel}</span>
                  </div>
                  <div className="font-medium text-[12px] text-graphite-200 leading-snug mb-1">{s.title}</div>
                  <p className="text-[10.5px] text-graphite-400 italic leading-relaxed line-clamp-3">"{s.text}"</p>
                </div>
                <div className="mt-2 border-t border-graphite-800/80 pt-1.5">
                  <MiniWave accent={isPlayingThis ? "#d8453c" : "#4fd1e0"} className="h-5" />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-[9px] text-graphite-500 uppercase">Band {s.band}</span>
                  <span className={cn(
                    "mono-label text-[9px] px-1.5 py-0.5 rounded",
                    isPlayingThis ? "bg-alert text-white font-bold" : "bg-graphite-800 text-graphite-300"
                  )}>
                    {isPlayingThis ? "▶ Speaking..." : "▶ Transmit"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Transcript Ticker Banner */}
      <div className="mt-3 rounded-sm border border-graphite-700 bg-graphite-950/90 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="mono-label text-graphite-500 shrink-0">Live transcript:</span>
          {tx.isTransmitting ? (
            <div className="flex items-center gap-2 min-w-0 font-mono text-[11.5px] text-cyan-tech">
              <span className="shrink-0 font-bold text-alert">[{tx.activeSentence?.callsign || "TRANSMIT"}]:</span>
              <span className="truncate italic">"{tx.transcript}"</span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-graphite-500 italic">
              Ready. Press any sentence above or hold PTT on walkie-talkie to transmit.
            </span>
          )}
        </div>

        {/* Real analyser-driven VU, not CSS approximation */}
        <div className="w-40 shrink-0">
          <VuMeter segments={18} accent={a.processed ? "#4fd1e0" : "#f0a93b"} />
        </div>
      </div>

      {/* WAVE COMPARISON — the whole point: same transmission, two channels */}
      <div className="mt-4 rounded-sm border border-graphite-700 bg-graphite-950/50 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="mono-label text-amber-glow">Waveform comparison · same transmission, two feeds</span>
          <span className="mono-label text-graphite-500">
            {tx.isTransmitting ? "transmitting — watch the carrier floor vs gated voice" : "idle — press a sentence above to see the difference"}
          </span>
        </div>
        <CompareWaves height={68} />
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <SpectrumBars height={60} />
          <div className="flex items-center gap-3 rounded-sm border border-graphite-700 bg-graphite-950/70 px-3">
            <div>
              <div className="mono-label text-graphite-500">level</div>
              <VuMeter />
            </div>
            <span className="mono-label max-w-[150px] text-graphite-500">
              {a.processed ? "hiss suppressed between syllables" : "carrier floor rides with the voice"}
            </span>
          </div>
        </div>
      </div>

      {/* Control Sliders & Audio Bus Switcher */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 pt-3 border-t border-graphite-800">
        <div className="space-y-2.5">
          <Slider label="Volume" value={a.volume} onChange={(v) => setAudioSettings({ volume: v })} unit="%" />
          <Slider label="RF noise" value={a.noise} onChange={(v) => setAudioSettings({ noise: v })} unit="%" />
          <Slider label="Squelch" value={a.squelch} onChange={(v) => setAudioSettings({ squelch: v })} unit="%" />
          <Slider label="PRC" value={a.prc} onChange={(v) => setAudioSettings({ prc: v })} unit="%" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-sm border border-graphite-700 bg-graphite-950/70 px-3 py-2">
            <span className="mono-label text-graphite-400">Audio processing feed:</span>
            <div className="flex rounded-sm border border-graphite-700 p-0.5">
              <button
                onClick={() => setAudioSettings({ processed: false })}
                className={cn(
                  "mono-label rounded-sm px-3 py-1.5 text-[11px] transition-colors",
                  !a.processed ? "bg-graphite-700 text-graphite-100 font-bold" : "text-graphite-400 hover:text-graphite-200",
                )}
              >
                Raw radio (noisy)
              </button>
              <button
                onClick={() => setAudioSettings({ processed: true })}
                className={cn(
                  "mono-label rounded-sm px-3 py-1.5 text-[11px] transition-colors",
                  a.processed ? "bg-cyan-tech/25 text-cyan-tech font-bold" : "text-graphite-400 hover:text-graphite-200",
                )}
              >
                SHIELD-COM (clean)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="rounded-sm border border-graphite-700 bg-graphite-950/70 px-2.5 py-2">
              <div className="text-graphite-500">RF Carrier Static</div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-sm bg-graphite-800">
                <span className="block h-full bg-graphite-300 transition-all" style={{ width: `${a.noise * (1 - a.squelch) * 100}%` }} />
              </div>
            </div>
            <div className="rounded-sm border border-graphite-700 bg-graphite-950/70 px-2.5 py-2">
              <div className="text-graphite-500">Processing Filter</div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-sm bg-graphite-800">
                <span className="block h-full bg-cyan-tech transition-all" style={{ width: `${a.prc * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="rounded-sm border border-graphite-700 bg-graphite-950/70 px-3 py-2 font-mono text-[10px] text-graphite-400">
            {a.processed ? (
              <>
                <span className="text-cyan-tech font-bold">SHIELD-COM Active:</span> High-pass {Math.round(240 + a.prc * 260)} Hz · Soft-knee comp {(2 + a.prc * 4.5).toFixed(1)}:1 · Ambient carrier suppressed by 85%
              </>
            ) : (
              <>
                <span className="text-graphite-200 font-bold">Raw Receiver Bus:</span> Unfiltered 300 Hz–4.2 kHz band · Full RF carrier hiss & atmospheric crackle audible
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ section ------------------------------ */
export function Demo() {
  const demo = useDemo();
  return (
    <Section
      id="demo"
      eyebrow="Interactive demo"
      title="Press it here. Watch it happen on the model."
      lead="Both devices below are wired to the same live state as the 3D viewer. Hold SOS, tap MARK, key the radio's PTT or type a frequency — the light-pipes, the LCD, the knob and every readout follow instantly. Or let the scripted field scenario walk you through it."
      tone="amber"
    >
      <AudioPanel />

      {/* scripted run */}
      <div className="my-4 flex flex-col gap-3 rounded-sm border border-amber-glow/30 bg-amber-glow/[0.05] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mono-label text-amber-glow">Scripted field scenario · {DEMO_STEPS.length} steps · ~25 s</div>
          <p className="mt-1 text-[12.5px] text-graphite-300">
            Radio on → PTT keyed → SOS held and raised → two MARK clips → radio menu → torch → SOS cleared. The camera follows each step in the 3D viewer and audio plays through the radio link above.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => {
              initAudio();
              setAudioSettings({ muted: false });
              if (demo.running) {
                stopDemo();
              } else {
                requestViewer("assembled");
                window.setTimeout(startDemo, 500);
              }
            }}
            className={cn(
              "mono-label rounded-sm border px-4 py-2.5 transition-colors",
              demo.running ? "border-alert/50 bg-alert/15 text-alert" : "border-amber-glow/60 bg-amber-glow/20 text-amber-glow hover:bg-amber-glow/30",
            )}
          >
            {demo.running ? "■ Stop demo" : "▶ Run in the 3D viewer"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ShieldComDeck />
        <RadioDeck />
      </div>

      {/* step list */}
      <ol className="mt-4 grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2 lg:grid-cols-5">
        {DEMO_STEPS.map((s, i) => {
          const active = demo.running && demo.step === i;
          const done = demo.running && demo.step > i;
          return (
            <li key={s.title} className={cn("bg-graphite-950 p-3 transition-colors", active && "bg-amber-glow/10")}>
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-[10px]", active ? "text-amber-glow" : done ? "text-graphite-600" : "text-graphite-500")}>{String(i + 1).padStart(2, "0")}</span>
                <span className={cn("font-mono text-[10px] tracking-widest", active ? "text-amber-glow" : "text-graphite-300")}>{s.title}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-graphite-500">{s.caption}</p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/* keep the store warm for the LED loop even before anything is pressed */
void getDevice;
