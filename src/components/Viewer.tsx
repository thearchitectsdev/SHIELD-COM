import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import { PARTS, PARTS_BY_ID, SYSTEMS, SYSTEM_COLOR } from "@/data/parts";
import type { ModeId, PartDef, SystemId } from "@/data/parts";
import { ShieldComModel } from "@/three/ShieldCom";
import { ViewerCtx } from "@/three/state";
import { fmtFreq, useDevice } from "@/three/device";
import { DEMO_STEPS, startDemo, stopDemo, useDemo } from "@/three/demo";
import { RADIO_SENTENCES, getLevel, initAudio, setAudioSettings, useAudioSettings, useTransmission } from "@/three/audio";
import { radioPower } from "@/three/device";
import { SpectrumBars, VuMeter, WaveScope } from "@/components/Waveforms";
import { cn } from "@/utils/cn";

/**
 * COMMS BAR — the five tactical transmissions, available directly in the
 * assembled view (option A). Clicking a chip keys the radio, plays the
 * squelch burst and speaks the sentence through the live audio chain.
 */
function CommsBar() {
  const tx = useTransmission();
  const a = useAudioSettings();
  const d = useDevice();

  const key = (i: number) => {
    initAudio();
    setAudioSettings({ muted: false });
    if (!d.radio.power) radioPower();
    tx.setSentenceIndex(i);
    if (tx.isTransmitting) tx.stopTransmission();
    window.setTimeout(() => tx.transmitSentence(i), tx.isTransmitting ? 220 : 0);
  };

  return (
    <div className="mt-3 rounded-sm border border-cyan-tech/30 bg-graphite-900/70 p-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="mono-label text-cyan-tech">Option A · assembled view · voice transmissions</span>
        <div className="flex items-center gap-2">
          <span className="mono-label text-graphite-500">
            feed: <span className={a.processed ? "text-cyan-tech" : "text-amber-glow"}>{a.processed ? "SHIELD-COM" : "raw radio"}</span>
          </span>
          <button
            onClick={() => setAudioSettings({ processed: !a.processed })}
            className="mono-label rounded-sm border border-graphite-600 px-2 py-1 text-graphite-300 transition-colors hover:border-cyan-tech/50 hover:text-cyan-tech"
          >
            toggle noise
          </button>
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
        {RADIO_SENTENCES.map((s, i) => {
          const playing = tx.isTransmitting && tx.activeSentence?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => key(i)}
              title={s.text}
              className={cn(
                "group flex items-center gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors",
                playing
                  ? "border-alert bg-alert/15"
                  : "border-graphite-700 bg-graphite-950/70 hover:border-cyan-tech/50 hover:bg-graphite-900",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                  playing ? "border-alert bg-alert text-white" : "border-graphite-600 text-graphite-400 group-hover:border-cyan-tech/50 group-hover:text-cyan-tech",
                )}
              >
                {playing ? "▶" : `0${s.id}`}
              </span>
              <span className="min-w-0">
                <span className={cn("block truncate font-mono text-[10px] tracking-widest", playing ? "text-alert" : "text-graphite-300")}>{s.title}</span>
                <span className="block truncate font-mono text-[9px] text-graphite-500">
                  {s.callsign} · {s.channel}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* live waves — always visible so the shape of the channel is readable before you press anything */}
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="grid gap-2 sm:grid-cols-2">
          <WaveScope height={62} accent={a.processed ? "#4fd1e0" : "#f0a93b"} label={a.processed ? "shield-com · gated" : "raw · carrier + voice"} />
          <SpectrumBars height={62} />
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-graphite-700 bg-graphite-950/70 px-3">
          <div>
            <div className="mono-label text-graphite-500">level</div>
            <VuMeter />
          </div>
          <LevelReadout />
        </div>
      </div>

      {tx.isTransmitting && (
        <div className="mt-2 flex items-center gap-2 rounded-sm border border-alert/40 bg-alert/[0.08] px-3 py-1.5 font-mono text-[11px]">
          <span className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-alert" />
          <span className="shrink-0 font-bold text-alert">[{tx.activeSentence?.callsign}]</span>
          <span className="truncate italic text-graphite-200">"{tx.transcript}"</span>
          <button onClick={() => tx.stopTransmission()} className="ml-auto shrink-0 mono-label text-graphite-400 hover:text-alert">
            stop
          </button>
        </div>
      )}
    </div>
  );
}

/** numeric dB/level readout that tracks the analyser without re-rendering React */
function LevelReadout() {
  const lvl = useRef<HTMLSpanElement>(null);
  const db = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const l = getLevel();
      const dbs = l > 0.001 ? Math.max(-60, 20 * Math.log10(l)) : -60;
      if (lvl.current) lvl.current.textContent = `${Math.round(l * 100)}%`.padStart(4, " ");
      if (db.current) db.current.textContent = `${dbs <= -59 ? "−∞" : dbs.toFixed(1)} dB`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="text-right">
      <div className="mono-label text-graphite-500">rms</div>
      <div className="font-mono text-[12px] leading-tight text-cyan-tech">
        <span ref={lvl}>0%</span>
      </div>
      <div className="font-mono text-[9px] text-graphite-500">
        <span ref={db}>−∞ dB</span>
      </div>
    </div>
  );
}

/** narration bar shown while the scripted demo is running */
function DemoCaption() {
  const d = useDemo();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!d.running) return;
    const id = window.setInterval(() => tick((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [d.running]);
  if (!d.running || d.step < 0) return null;
  const s = DEMO_STEPS[d.step];
  const prog = Math.min(1, (performance.now() - d.stepStartedAt) / s.ms);
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-16 z-30 flex justify-center">
      <div className="pointer-events-auto w-full max-w-[640px] rounded-sm border border-amber-glow/40 bg-graphite-950/92 px-4 py-3 shadow-[0_0_40px_rgba(240,169,59,0.12)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <span className="mono-label text-amber-glow">
            Field demo · step {String(d.step + 1).padStart(2, "0")} / {String(DEMO_STEPS.length).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-graphite-300">{s.title}</span>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite-200">{s.caption}</p>
        <div className="mt-2 flex gap-0.5">
          {DEMO_STEPS.map((_, i) => (
            <span key={i} className="h-1 flex-1 overflow-hidden rounded-sm bg-graphite-800">
              <span
                className="block h-full bg-amber-glow"
                style={{ width: i < d.step ? "100%" : i === d.step ? `${prog * 100}%` : "0%", transition: i === d.step ? "width 100ms linear" : undefined }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveReadout() {
  const d = useDevice();
  const tx = useTransmission();
  const r = d.radio;
  const markRecent = d.markAt > 0 && performance.now() - d.markAt < 3000;
  const rows: [string, string, string][] = [
    ["#5cff9d", "PWR", "Steady — powered"],
    ["#4fd1e0", "PRC", r.ptt || r.monitor ? "Fast — audio keyed by host radio" : "Breathing — pipeline idle"],
    ["#ff4b3e", "SOS", d.sosActive ? "RAISED — 4 Hz blink" : d.sosHoldStart ? "Arming — keep holding" : "Dark — armed, hold 1.2 s"],
    ["#ffb02e", "MRK", markRecent ? "Burst — clip written" : d.markCount ? `Blink — ${d.markCount} clip${d.markCount > 1 ? "s" : ""} stored` : "Dark — tap MARK to tag"],
  ];
  const activeF = r.band === "A" ? r.freqA : r.freqB;
  return (
    <div className="mt-3 grid gap-2 rounded-sm border border-graphite-700 bg-graphite-900/70 px-3 py-2 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="mono-label text-graphite-500">Status · live</span>
        {rows.map(([c, k, t]) => (
          <span key={k} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full pulse-soft" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
            <span className="font-mono text-[10px] tracking-widest" style={{ color: c }}>
              {k}
            </span>
            <span className="font-mono text-[10px] text-graphite-500">{t}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-graphite-800 pt-2 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
        <span className="mono-label text-graphite-500">Host radio</span>
        <span className={cn("font-mono text-[10px] tracking-widest", r.power ? "text-cyan-tech" : "text-graphite-500")}>{r.power ? "ON" : "OFF"}</span>
        {r.power && (
          <>
            <span className="font-mono text-[10px] text-graphite-300">
              {r.mode === "MR" ? `CH-${String(r.band === "A" ? r.chA : r.chB).padStart(3, "0")}` : `${fmtFreq(activeF)} MHz`} · {r.band}
            </span>
            {r.ptt && <span className="rounded-sm bg-alert/20 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-alert">TX</span>}
            {r.monitor && <span className="rounded-sm bg-cyan-tech/15 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-cyan-tech">MON</span>}
            {r.scan && <span className="font-mono text-[10px] tracking-widest text-graphite-400">SCAN</span>}
            {r.keylock && <span className="font-mono text-[10px] tracking-widest text-graphite-400">LOCK</span>}
            {r.torch && <span className="font-mono text-[10px] tracking-widest text-amber-glow">TORCH</span>}
          </>
        )}
        <span className="mono-label hidden text-graphite-600 xl:inline">· keys, knob, PTT & torch are clickable</span>
      </div>
      {tx.isTransmitting && (
        <div className="col-span-full mt-1 flex items-center justify-between gap-2 rounded-sm border border-cyan-tech/40 bg-cyan-tech/[0.08] px-3 py-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-alert animate-ping shrink-0" />
            <span className="font-bold text-alert shrink-0">[{tx.activeSentence?.callsign || "COMMS"}]:</span>
            <span className="text-cyan-tech truncate italic">"{tx.transcript}"</span>
          </div>
          <span className="text-graphite-400 shrink-0 text-[10px] hidden sm:inline">Tactical Comms #{tx.selectedIndex + 1}</span>
        </div>
      )}
    </div>
  );
}

export function requestViewer(mode: ModeId, part?: string) {
  window.dispatchEvent(new CustomEvent("shieldcom:mode", { detail: { mode, part } }));
  const el = document.getElementById("viewer");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const MODES: { id: ModeId; label: string; hint: string }[] = [
  { id: "assembled", label: "Assembled", hint: "Sealed field unit" },
  { id: "exploded", label: "Exploded", hint: "Assembly layers" },
  { id: "pcb", label: "PCB Detail", hint: "Populated board" },
  { id: "internal", label: "Internal", hint: "Cut-away chain" },
];

/** the model group is lifted so the enclosure sits on the grid plane */
const MODEL_Y = 1.0;

const VIEWS: Record<ModeId, { pos: [number, number, number]; target: [number, number, number] }> = {
  assembled: { pos: [10.5, 8.5, 19.5], target: [-4.2, 4.4, 0.2] },
  exploded: { pos: [13.5, 10.5, 17.5], target: [0, 2.9, 0] },
  pcb: { pos: [2.0, 11.0, 9.0], target: [0, 1.6, 0] },
  internal: { pos: [10.5, 7.0, 12.0], target: [0, 0.9, 0] },
};

interface Goal {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  active: boolean;
}

function Rig({ mode, focus, nonce, goalRef }: { mode: ModeId; focus: string | null; nonce: number; goalRef: React.RefObject<Goal> }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;

  useEffect(() => {
    const v = VIEWS[mode];
    const g = goalRef.current;
    if (!g) return;
    if (focus && PARTS_BY_ID[focus]) {
      const p = PARTS_BY_ID[focus];
      const t = new THREE.Vector3(p.pos[0], Math.max(p.pos[1], 0) + MODEL_Y, p.pos[2]);
      if (p.id === "host-radio") t.set(-11.8, MODEL_Y + 6.0, 1.6);
      const dir = new THREE.Vector3().subVectors(camera.position, t).normalize();
      const dist = p.id === "host-radio" ? 26 : p.group.startsWith("PCB") ? 7.5 : 11;
      g.pos.copy(t.clone().add(dir.multiplyScalar(dist)));
      g.target.copy(t);
    } else {
      g.pos.set(...v.pos);
      g.target.set(...v.target);
    }
    g.active = true;
  }, [mode, focus, nonce, camera, goalRef]);

  useFrame((_, dt) => {
    const g = goalRef.current;
    if (!g || !g.active || !controls) return;
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(g.pos, k);
    controls.target.lerp(g.target, k);
    controls.update();
    if (camera.position.distanceTo(g.pos) < 0.06) g.active = false;
  });

  return null;
}

function Studio() {
  return (
    <>
      <ambientLight intensity={0.42} color="#b8c6c4" />
      <directionalLight position={[8, 14, 9]} intensity={2.0} color="#fff6e8" />
      <directionalLight position={[-10, 7, -8]} intensity={0.85} color="#4fd1e0" />
      <directionalLight position={[2, 4, -12]} intensity={0.65} color="#f0a93b" />
      <pointLight position={[0, 5, 6]} intensity={14} distance={22} color="#dfe9e6" />
      {/* practical studio heads aimed at the module */}
      <spotLight position={[3.5, 9, 7]} angle={0.55} penumbra={0.9} intensity={26} distance={30} decay={2} color="#ffe9cd" target-position={[0, 0.6, 0]} />
      <spotLight position={[-7, 6, -6]} angle={0.7} penumbra={1} intensity={16} distance={28} decay={2} color="#6fdcea" target-position={[-2, 0.4, 0]} />
      <spotLight position={[7, 3.4, -7]} angle={0.8} penumbra={1} intensity={12} distance={26} decay={2} color="#f0a93b" target-position={[1, 0.4, -0.5]} />
      {/* faint amber floor wash under the unit */}
      <pointLight position={[0, -0.6, -3.4]} intensity={2.6} distance={9} decay={2} color="#f0a93b" />
      <pointLight position={[-9, 1.4, 3]} intensity={3.2} distance={12} decay={2} color="#4fd1e0" />
      <Environment resolution={128} frames={1}>
        <mesh scale={60}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#0a0d0e" side={THREE.BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={3.2} position={[0, 9, 4]} scale={[14, 7, 1]} rotation={[-Math.PI / 2.2, 0, 0]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.4} position={[-10, 3, -6]} scale={[10, 6, 1]} rotation={[0, -Math.PI / 3, 0]} color="#63d7e6" />
        <Lightformer form="rect" intensity={1.1} position={[9, 2, -7]} scale={[8, 5, 1]} rotation={[0, Math.PI / 2.6, 0]} color="#f0a93b" />
        <Lightformer form="rect" intensity={0.9} position={[0, 2, 12]} scale={[14, 4, 1]} color="#93a5a3" />
      </Environment>
    </>
  );
}

export default function Viewer() {
  const [mode, setMode] = useState<ModeId>("assembled");
  const [labels, setLabels] = useState(true);
  const [dims, setDims] = useState(false);
  const [pcbSpread, setPcbSpread] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [isolate, setIsolate] = useState<SystemId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const goalRef = useRef<Goal>({ pos: new THREE.Vector3(...VIEWS.assembled.pos), target: new THREE.Vector3(...VIEWS.assembled.target), active: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "250px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const { mode: m, part } = (e as CustomEvent).detail as { mode: ModeId; part?: string };
      setMode(m);
      if (m === "pcb") setPcbSpread(false);
      if (part && PARTS_BY_ID[part]) {
        setSelected(part);
        setFocus(part);
      } else {
        setSelected(null);
        setFocus(null);
      }
      setNonce((n) => n + 1);
    };
    window.addEventListener("shieldcom:mode", h);
    return () => window.removeEventListener("shieldcom:mode", h);
  }, []);

  /* scripted demo: frame parts as the script narrates them */
  useEffect(() => {
    const onStart = () => {
      setMode("assembled");
      setShowContext(true);
      setIsolate(null);
      setPcbSpread(false);
    };
    const onFocus = (e: Event) => {
      const { part } = (e as CustomEvent).detail as { part: string | null };
      if (part && PARTS_BY_ID[part]) {
        setSelected(part);
        setFocus(part);
      } else {
        setSelected(null);
        setFocus(null);
      }
      setNonce((n) => n + 1);
    };
    window.addEventListener("shieldcom:demo-start", onStart);
    window.addEventListener("shieldcom:demo-focus", onFocus);
    return () => {
      window.removeEventListener("shieldcom:demo-start", onStart);
      window.removeEventListener("shieldcom:demo-focus", onFocus);
      stopDemo();
    };
  }, []);

  const changeMode = useCallback((m: ModeId) => {
    setMode(m);
    setFocus(null);
    setNonce((n) => n + 1);
  }, []);

  const resetAll = useCallback(() => {
    setMode("assembled");
    setPcbSpread(false);
    setIsolate(null);
    setSelected(null);
    setFocus(null);
    setShowContext(true);
    setNonce((n) => n + 1);
  }, []);

  const labelSet = useMemo(() => {
    const vis = PARTS.filter((p) => p.modes.includes(mode) && (p.labelPriority ?? 0) >= 4);
    const sorted = vis.sort((a, b) => (b.labelPriority ?? 0) - (a.labelPriority ?? 0));
    const cap = mode === "pcb" ? 9 : 8;
    const set = new Set(sorted.slice(0, cap).map((p) => p.id));
    if (selected && PARTS_BY_ID[selected]?.modes.includes(mode)) set.add(selected);
    return set;
  }, [mode, selected]);

  const api = useMemo(
    () => ({ mode, labels, dims, pcbSpread, showContext, isolate, selected, hovered, labelSet, setSelected, setHovered }),
    [mode, labels, dims, pcbSpread, showContext, isolate, selected, hovered, labelSet],
  );

  const pick = useCallback(
    (p: PartDef) => {
      setSelected(p.id);
      if (!p.modes.includes(mode)) {
        const next: ModeId = p.modes.includes("internal") ? "internal" : p.modes.includes("pcb") ? "pcb" : p.modes[0];
        setMode(next);
      }
      setFocus(p.id);
      setNonce((n) => n + 1);
    },
    [mode],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? PARTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.ref.toLowerCase().includes(q) ||
            p.system.includes(q) ||
            (p.pkg ?? "").toLowerCase().includes(q) ||
            p.group.toLowerCase().includes(q),
        )
      : PARTS;
    const groups = new Map<string, PartDef[]>();
    for (const p of list) {
      if (!groups.has(p.group)) groups.set(p.group, []);
      groups.get(p.group)!.push(p);
    }
    return Array.from(groups.entries());
  }, [query]);

  const sel = selected ? PARTS_BY_ID[selected] : null;
  const hov = hovered ? PARTS_BY_ID[hovered] : null;
  const sosActive = useDevice().sosActive;
  const demoRunning = useDemo().running;

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  return (
    <ViewerCtx.Provider value={api}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[236px_minmax(0,1fr)_296px]">
        {/* ─── parts list ─── */}
        <aside className="order-2 flex max-h-[520px] flex-col rounded-sm border border-graphite-700 bg-graphite-900/70 lg:order-1 lg:max-h-[640px]">
          <div className="border-b border-graphite-700 p-3">
            <div className="mono-label mb-2 text-graphite-400">Parts index · {PARTS.length}</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, name, package…"
              className="w-full rounded-sm border border-graphite-600 bg-graphite-950 px-2 py-1.5 font-mono text-[11px] text-graphite-200 outline-none placeholder:text-graphite-500 focus:border-cyan-tech/60"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filtered.map(([group, items]) => (
              <div key={group} className="mb-3">
                <div className="mono-label px-1 pb-1 text-graphite-500">{group}</div>
                {items.map((p) => {
                  const active = selected === p.id;
                  const available = p.modes.includes(mode);
                  return (
                    <button
                      key={p.id}
                      onClick={() => pick(p)}
                      onMouseEnter={() => setHovered(p.id)}
                      onMouseLeave={() => setHovered(null)}
                      className={cn(
                        "group flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors",
                        active ? "bg-amber-glow/12 text-amber-glow" : "hover:bg-graphite-800 text-graphite-300",
                      )}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SYSTEM_COLOR[p.system], opacity: available ? 1 : 0.3 }} />
                      <span className="w-12 shrink-0 font-mono text-[10px] text-graphite-500">{p.ref}</span>
                      <span className={cn("truncate text-[11px]", !available && "text-graphite-500")}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-3 text-center font-mono text-[11px] text-graphite-500">No match</div>}
          </div>
        </aside>

        {/* ─── canvas ─── */}
        <div className="order-1 lg:order-2">
          <div
            ref={stageRef}
            className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-graphite-700 bg-[#080a0b] md:aspect-[16/10] lg:aspect-auto lg:h-[640px]"
          >
            <div className="pointer-events-none absolute inset-0 z-10 grid-bg opacity-40" />
            <Canvas
              frameloop={inView ? "always" : "never"}
              dpr={[1, 1.8]}
              camera={{ position: VIEWS.assembled.pos, fov: 32, near: 0.1, far: 200 }}
              gl={{ antialias: true, powerPreference: "high-performance" }}
              onPointerMissed={() => setSelected(null)}
              onPointerDown={() => {
                goalRef.current.active = false;
                initAudio();
              }}
            >
              <color attach="background" args={["#080a0b"]} />
              <fog attach="fog" args={["#080a0b", 26, 62]} />
              <Studio />
              <group position={[0, 1.0, 0]}>
                <ShieldComModel />
                <ContactShadows position={[0, -1.02, 0]} opacity={0.62} scale={44} blur={2.4} far={5} resolution={512} color="#000000" />
                <Grid
                  position={[0, -1.04, 0]}
                  args={[70, 70]}
                  cellSize={1}
                  cellThickness={0.5}
                  cellColor="#16211f"
                  sectionSize={5}
                  sectionThickness={0.9}
                  sectionColor="#1f3a3a"
                  fadeDistance={54}
                  fadeStrength={1.6}
                  infiniteGrid
                />
              </group>
              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={4.5}
                maxDistance={42}
                maxPolarAngle={Math.PI / 2.05}
                target={VIEWS.assembled.target}
              />
              <Rig mode={mode} focus={focus} nonce={nonce} goalRef={goalRef} />
            </Canvas>

            {/* mode bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-3">
              <div className="pointer-events-auto flex flex-wrap gap-1 rounded-sm border border-graphite-700 bg-graphite-950/85 p-1 backdrop-blur">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => changeMode(m.id)}
                    title={m.hint}
                    className={cn(
                      "mono-label rounded-sm px-2.5 py-2 transition-colors",
                      mode === m.id ? "bg-cyan-tech/15 text-cyan-tech" : "text-graphite-400 hover:bg-graphite-800 hover:text-graphite-200",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="pointer-events-auto flex flex-wrap justify-end gap-1">
                <Toggle on={labels} onClick={() => setLabels((v) => !v)} label="Labels" />
                <Toggle on={dims} onClick={() => setDims((v) => !v)} label="Dimensions" />
                <Toggle on={showContext} onClick={() => setShowContext((v) => !v)} label="Host radio" />
              </div>
            </div>

            <DemoCaption />

            {/* bottom bar */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-2 p-3">
              <div className="pointer-events-auto flex flex-wrap items-center gap-1">
                <button
                  onClick={() => (demoRunning ? stopDemo() : startDemo())}
                  className={cn(
                    "mono-label rounded-sm border px-3 py-2 transition-colors",
                    demoRunning
                      ? "border-alert/50 bg-alert/15 text-alert hover:bg-alert/25"
                      : "border-amber-glow/60 bg-amber-glow/20 text-amber-glow shadow-[0_0_18px_rgba(240,169,59,0.18)] hover:bg-amber-glow/30",
                  )}
                >
                  {demoRunning ? "■ Stop demo" : "▶ Run field demo"}
                </button>
                <button
                  onClick={() => {
                    stopDemo();
                    resetAll();
                  }}
                  className="mono-label rounded-sm border border-graphite-600 bg-graphite-950/85 px-3 py-2 text-graphite-300 transition-colors hover:border-graphite-500"
                >
                  ⟲ Reset · Assemble
                </button>
                {mode === "pcb" && (
                  <button
                    onClick={() => setPcbSpread((v) => !v)}
                    className={cn(
                      "mono-label rounded-sm border px-3 py-2 transition-colors",
                      pcbSpread
                        ? "border-cyan-tech/50 bg-cyan-tech/15 text-cyan-tech"
                        : "border-graphite-600 bg-graphite-950/85 text-graphite-300 hover:border-graphite-500",
                    )}
                  >
                    {pcbSpread ? "▼ Seat components" : "▲ Inspect · lift components"}
                  </button>
                )}
                {mode === "exploded" && (
                  <button
                    onClick={() => changeMode("assembled")}
                    className="mono-label rounded-sm border border-graphite-600 bg-graphite-950/85 px-3 py-2 text-graphite-300 transition-colors hover:border-graphite-500"
                  >
                    ▼ Assemble
                  </button>
                )}
              </div>
              <div className="mono-label pointer-events-none rounded-sm bg-graphite-950/70 px-2 py-1.5 text-graphite-500">
                Drag orbit · Right-drag pan · Scroll zoom
              </div>
            </div>

            {/* hover readout */}
            {hov && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-sm border border-cyan-tech/30 bg-graphite-950/90 px-3 py-1.5">
                <span className="font-mono text-[10px] tracking-widest text-cyan-tech">{hov.ref}</span>
                <span className="ml-2 font-mono text-[10px] tracking-wide text-graphite-300">{hov.name}</span>
              </div>
            )}
          </div>

          <LiveReadout />
          <CommsBar />
          {sosActive && (
            <div className="mt-2 flex items-center gap-2 rounded-sm border border-alert/50 bg-alert/10 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-alert" style={{ boxShadow: "0 0 10px #d8453c" }} />
              <span className="font-mono text-[10px] tracking-widest text-alert">SOS EVENT RAISED</span>
              <span className="font-mono text-[10px] text-graphite-400">— hold the SOS control again for 1.2 s to clear</span>
            </div>
          )}

          {/* isolation strip */}
          <div className="mt-3 flex flex-wrap items-center gap-1 rounded-sm border border-graphite-700 bg-graphite-900/70 p-2">
            <span className="mono-label mr-1 px-1 text-graphite-500">Isolate system</span>
            {SYSTEMS.filter((s) => s.id !== "context").map((s) => (
              <button
                key={s.id}
                onClick={() => setIsolate(isolate === s.id ? null : s.id)}
                className={cn(
                  "mono-label flex items-center gap-1.5 rounded-sm border px-2 py-1.5 transition-colors",
                  isolate === s.id ? "border-transparent text-graphite-950" : "border-graphite-600 text-graphite-400 hover:text-graphite-200",
                )}
                style={isolate === s.id ? { background: s.color } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: isolate === s.id ? "#0b0e0f" : s.color }} />
                {s.name}
              </button>
            ))}
            {isolate && (
              <button onClick={() => setIsolate(null)} className="mono-label ml-auto rounded-sm px-2 py-1.5 text-amber-glow hover:underline">
                Clear ✕
              </button>
            )}
          </div>
        </div>

        {/* ─── info panel ─── */}
        <aside className="order-3 flex max-h-[520px] flex-col overflow-hidden rounded-sm border border-graphite-700 bg-graphite-900/70 lg:max-h-[640px]">
          <div className="border-b border-graphite-700 p-3">
            <div className="mono-label text-graphite-400">Engineering data</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {sel ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: SYSTEM_COLOR[sel.system] }} />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-graphite-400">{sel.ref}</span>
                  </div>
                  <h4 className="mt-1 text-[15px] font-medium text-graphite-200">{sel.name}</h4>
                  {sel.pkg && <div className="mt-0.5 font-mono text-[10px] text-cyan-tech/80">{sel.pkg}</div>}
                </div>
                <p className="text-[12px] leading-relaxed text-graphite-300">{sel.summary}</p>
                <div className="divide-y divide-graphite-700 border-y border-graphite-700">
                  {sel.specs.map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3 py-1.5">
                      <span className="mono-label pt-0.5 text-graphite-500">{k}</span>
                      <span className="text-right font-mono text-[11px] text-graphite-200">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setFocus(sel.id);
                      setNonce((n) => n + 1);
                    }}
                    className="mono-label flex-1 rounded-sm border border-graphite-600 py-2 text-graphite-300 hover:border-cyan-tech/50 hover:text-cyan-tech"
                  >
                    Focus
                  </button>
                  <button
                    onClick={() => setIsolate(sel.system === "context" ? null : sel.system)}
                    className="mono-label flex-1 rounded-sm border border-graphite-600 py-2 text-graphite-300 hover:border-cyan-tech/50 hover:text-cyan-tech"
                  >
                    Isolate system
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] leading-relaxed text-graphite-400">
                  Select any component in the model or the index. Hover highlights, click selects, and the camera can focus a single part.
                </p>
                <div className="divide-y divide-graphite-700 border-y border-graphite-700">
                  {[
                    ["View", MODES.find((m) => m.id === mode)?.label ?? ""],
                    ["Parts in view", String(PARTS.filter((p) => p.modes.includes(mode)).length)],
                    ["Envelope", "78 × 44 × 19.2 mm"],
                    ["Board", "66 × 34 mm · 4 layer"],
                    ["Controls", "SOS + MARK only"],
                    ["Indicators", "4 × status LED"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5">
                      <span className="mono-label text-graphite-500">{k}</span>
                      <span className="font-mono text-[11px] text-graphite-200">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-sm border border-graphite-700 bg-graphite-950/60 p-2.5">
                  <div className="mono-label mb-1.5 text-amber-glow">Reading the model</div>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-graphite-400">
                    <li>· Exploded parts stay on the assembly axis they belong to.</li>
                    <li>· PCB inspection lifts packages, then seats them again.</li>
                    <li>· Internal view ghosts the shell instead of hiding it.</li>
                    <li className="text-graphite-300">· Hold SOS 1.2 s to raise an event; tap MARK to store a clip.</li>
                    <li className="text-graphite-300">· Host radio keys, knob, PTT, CALL, MONI and torch are live.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </ViewerCtx.Provider>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mono-label rounded-sm border px-2.5 py-2 backdrop-blur transition-colors",
        on ? "border-cyan-tech/50 bg-cyan-tech/15 text-cyan-tech" : "border-graphite-700 bg-graphite-950/85 text-graphite-400 hover:text-graphite-200",
      )}
    >
      <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle", on ? "bg-cyan-tech" : "bg-graphite-600")} />
      {label}
    </button>
  );
}
