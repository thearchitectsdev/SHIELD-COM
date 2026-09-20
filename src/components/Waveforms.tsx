import { useEffect, useRef } from "react";
import { getLevel, getPeak, getSpectrum, getWaveform, isTransmitting } from "@/three/audio";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------ *
 * WAVEFORM / SPECTRUM VISUALISERS
 * All three read the same analyser tap in the audio engine, so they can
 * be placed side by side and always agree — which is what makes the
 * raw-vs-processed comparison readable at a glance.
 * ------------------------------------------------------------------ */

const dpr = () => Math.min(2, window.devicePixelRatio || 1);

function setupCanvas(c: HTMLCanvasElement) {
  const r = c.getBoundingClientRect();
  const ratio = dpr();
  const w = Math.max(120, Math.round(r.width * ratio));
  const h = Math.max(40, Math.round(r.height * ratio));
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return { w, h, ratio };
}

/* ------------------------- oscilliscope wave ------------------------- */
export function WaveScope({ height = 74, accent = "#4fd1e0", label = "waveform", showGrid = true }: { height?: number; accent?: string; label?: string; showGrid?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = ref.current;
      if (c) {
        const g = c.getContext("2d");
        if (g) {
          const { w, h } = setupCanvas(c);
          const mid = h / 2;
          g.clearRect(0, 0, w, h);
          g.fillStyle = "#0a0d0e";
          g.fillRect(0, 0, w, h);

          if (showGrid) {
            g.strokeStyle = "rgba(255,255,255,0.05)";
            g.lineWidth = 1;
            for (let i = 1; i < 4; i++) {
              const y = (h / 4) * i;
              g.beginPath();
              g.moveTo(0, y);
              g.lineTo(w, y);
              g.stroke();
            }
            for (let i = 1; i < 8; i++) {
              const x = (w / 8) * i;
              g.beginPath();
              g.moveTo(x, 0);
              g.lineTo(x, h);
              g.stroke();
            }
          }

          const live = isTransmitting();
          const wave = getWaveform();

          // centre line
          g.strokeStyle = "rgba(255,255,255,0.14)";
          g.beginPath();
          g.moveTo(0, mid);
          g.lineTo(w, mid);
          g.stroke();

          // filled envelope
          g.beginPath();
          for (let i = 0; i < wave.length; i++) {
            const x = (i / (wave.length - 1)) * w;
            const y = mid + ((wave[i] - 128) / 128) * (mid - 3);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.lineTo(w, mid);
          g.lineTo(0, mid);
          g.closePath();
          const grad = g.createLinearGradient(0, 0, 0, h);
          grad.addColorStop(0, `${accent}44`);
          grad.addColorStop(0.5, `${accent}18`);
          grad.addColorStop(1, `${accent}44`);
          g.fillStyle = grad;
          g.fill();

          // stroke trace
          g.beginPath();
          for (let i = 0; i < wave.length; i++) {
            const x = (i / (wave.length - 1)) * w;
            const y = mid + ((wave[i] - 128) / 128) * (mid - 3);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.strokeStyle = live ? accent : `${accent}66`;
          g.lineWidth = 1.6 * dpr();
          g.shadowColor = live ? accent : "transparent";
          g.shadowBlur = live ? 6 : 0;
          g.stroke();
          g.shadowBlur = 0;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accent, showGrid]);
  return (
    <div className="relative">
      <canvas ref={ref} style={{ height }} className="w-full rounded-sm border border-graphite-700" />
      <span className="mono-label absolute left-2 top-1.5 text-graphite-600">{label}</span>
    </div>
  );
}

/* --------------------------- spectrum bars --------------------------- */
export function SpectrumBars({
  height = 74,
  accent = "#4fd1e0",
  hotColor = "#ff5a46",
  warmColor = "#f0a93b",
  label = "spectrum",
}: {
  height?: number;
  accent?: string;
  hotColor?: string;
  warmColor?: string;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = ref.current;
      if (c) {
        const g = c.getContext("2d");
        if (g) {
          const { w, h } = setupCanvas(c);
          g.clearRect(0, 0, w, h);
          g.fillStyle = "#0a0d0e";
          g.fillRect(0, 0, w, h);
          // dB grid
          g.strokeStyle = "rgba(255,255,255,0.05)";
          g.lineWidth = 1;
          for (let i = 1; i < 4; i++) {
            const y = (h / 4) * i;
            g.beginPath();
            g.moveTo(0, y);
            g.lineTo(w, y);
            g.stroke();
          }

          const spec = getSpectrum();
          const bars = 56;
          const bw = w / bars;
          for (let i = 0; i < bars; i++) {
            // log-ish frequency mapping so voice bands get real estate
            const idx = Math.floor(Math.pow(i / bars, 1.55) * (spec.length - 1));
            const v = spec[idx] / 255;
            const bh = Math.max(1.5, v * (h - 5));
            const x = i * bw;
            g.fillStyle = v > 0.74 ? hotColor : v > 0.42 ? warmColor : accent;
            g.globalAlpha = 0.3 + v * 0.7;
            g.fillRect(x + 0.8, h - 2 - bh, bw - 1.6, bh);
          }
          g.globalAlpha = 1;
          g.fillStyle = "#1c2224";
          g.fillRect(0, h - 2, w, 2);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accent, hotColor, warmColor]);
  return (
    <div className="relative">
      <canvas ref={ref} style={{ height }} className="w-full rounded-sm border border-graphite-700" />
      <span className="mono-label absolute left-2 top-1.5 text-graphite-600">{label}</span>
      <span className="mono-label absolute right-2 top-1.5 text-graphite-600">80 Hz → 4 kHz</span>
    </div>
  );
}

/* ------------------------------ VU meter ----------------------------- */
export function VuMeter({ segments = 22, accent = "#4fd1e0" }: { segments?: number; accent?: string }) {
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const lvl = getLevel();
      const peak = getPeak();
      for (let i = 0; i < segments; i++) {
        const el = fills.current[i];
        if (!el) continue;
        const on = i / segments < lvl;
        const isPeak = Math.abs(i / segments - peak) < 0.05;
        el.style.opacity = on ? "1" : isPeak ? "0.55" : "0.14";
        el.style.background = i / segments > 0.84 ? "#ff5a46" : i / segments > 0.64 ? "#f0a93b" : accent;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [segments, accent]);
  return (
    <div className="flex h-full items-end gap-[2px]" style={{ height: 20 }}>
      {Array.from({ length: segments }).map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            fills.current[i] = el;
          }}
          className="flex-1 rounded-[1px] transition-opacity duration-75"
          style={{ height: `${30 + (i / segments) * 70}%` }}
        />
      ))}
    </div>
  );
}

/* ----------------- side-by-side raw vs processed pair ---------------- */
export function CompareWaves({ height = 64 }: { height?: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-sm border border-graphite-700 bg-graphite-950/60 p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-label text-amber-glow">raw radio</span>
          <span className="mono-label text-graphite-600">unfiltered</span>
        </div>
        <WaveScope height={height} accent="#f0a93b" label="carrier + voice" />
      </div>
      <div className="rounded-sm border border-graphite-700 bg-graphite-950/60 p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="mono-label text-cyan-tech">shield-com</span>
          <span className="mono-label text-graphite-600">noise gated</span>
        </div>
        <WaveScope height={height} accent="#4fd1e0" label="voice only" />
      </div>
    </div>
  );
}

/** compact inline strip for use inside dense rows */
export function MiniWave({ className, accent = "#4fd1e0" }: { className?: string; accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const c = ref.current;
      if (c) {
        const g = c.getContext("2d");
        if (g) {
          const { w, h } = setupCanvas(c);
          g.clearRect(0, 0, w, h);
          const wave = getWaveform();
          const mid = h / 2;
          g.beginPath();
          for (let i = 0; i < wave.length; i++) {
            const x = (i / (wave.length - 1)) * w;
            const y = mid + ((wave[i] - 128) / 128) * (mid - 1);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          }
          g.strokeStyle = isTransmitting() ? accent : `${accent}55`;
          g.lineWidth = 1.3 * dpr();
          g.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [accent]);
  return <canvas ref={ref} className={cn("h-6 w-full", className)} />;
}
