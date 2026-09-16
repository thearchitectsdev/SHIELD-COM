import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import Scene, { CHAPTERS, DEMO_END } from './Scene'
import { HOME_POS, HOME_TGT, useViewer, ViewerProvider, type Mode } from './lib/viewer'
import { FLOW, PARTS } from './lib/parts'

/* ================================================================== */
/*  assembly hierarchy                                                 */
/* ================================================================== */
type Node = { id: string; label: string; children?: Node[] }

const TREE: Node[] = [
  { id: 'upper-enclosure', label: 'Upper Enclosure' },
  { id: 'lower-enclosure', label: 'Lower Enclosure' },
  { id: 'gasket', label: 'Sealing Gasket' },
  { id: 'internal-frame', label: 'Internal Frame' },
  {
    id: 'main-pcb',
    label: 'Main PCB',
    children: [
      { id: 'esp32', label: 'ESP32 Processing Module' },
      { id: 'esp32-shield', label: 'RF Shield / Antenna Region' },
      { id: 'audio-adc', label: 'Audio ADC' },
      { id: 'audio-dac', label: 'Audio DAC / Output Amp' },
      { id: 'analog-filter', label: 'Analog Filtering Network' },
      { id: 'power-mgmt', label: 'Power-Management IC' },
      { id: 'buck-reg', label: '3.3 V Buck Regulator' },
      { id: 'ldo-reg', label: 'Low-Noise Analog LDO' },
      { id: 'inductor', label: 'Power Inductor' },
      { id: 'flash', label: 'Non-Volatile Memory' },
      { id: 'crystal', label: '40 MHz Reference Crystal' },
      { id: 'passives', label: 'Passive Components' },
      { id: 'esd-protection', label: 'ESD / Transient Protection' },
      { id: 'test-points', label: 'Test Points' },
      { id: 'usb-c', label: 'USB-C Service Port' },
      { id: 'battery-connector', label: 'Battery Connector J1' },
      { id: 'io-header', label: 'Debug Header' },
      { id: 'status-leds', label: 'Status LED Array' },
    ],
  },
  {
    id: 'mic-voice',
    label: 'Audio System',
    children: [
      { id: 'mic-voice', label: 'MEMS Mic — Voice (MIC1)' },
      { id: 'mic-ref', label: 'MEMS Mic — Noise Ref (MIC2)' },
      { id: 'acoustic-gasket', label: 'Acoustic Gaskets' },
      { id: 'acoustic-duct', label: 'Acoustic Channels' },
      { id: 'acoustic-mesh', label: 'Protective Acoustic Mesh' },
      { id: 'audio-harness', label: 'Internal Audio Harness' },
    ],
  },
  {
    id: 'sos-button',
    label: 'Controls',
    children: [
      { id: 'sos-button', label: 'SOS Button' },
      { id: 'mark-button', label: 'MARK Button' },
      { id: 'power-switch', label: 'Power / Mode Switch' },
    ],
  },
  {
    id: 'speaker-grille',
    label: 'External Hardware',
    children: [
      { id: 'speaker-grille', label: 'Water-Shedding Speaker Grille' },
      { id: 'speaker-driver', label: 'Speaker Driver' },
      { id: 'ptt-button', label: 'PTT Pad (Side)' },
    ],
  },
  {
    id: 'light-pipes',
    label: 'Status Indicators',
    children: [
      { id: 'light-pipes', label: 'Light Pipes / Window' },
      { id: 'status-leds', label: 'Status LED Array' },
    ],
  },
  {
    id: 'battery',
    label: 'Power',
    children: [
      { id: 'battery', label: 'Li-Ion Battery Pack' },
      { id: 'protection-circuit', label: 'Protection Module (PCM)' },
      { id: 'battery-cable', label: 'Battery Wiring' },
    ],
  },
  {
    id: 'internal-frame',
    label: 'Mechanical',
    children: [
      { id: 'screws', label: 'Screws' },
      { id: 'standoffs', label: 'Standoffs' },
      { id: 'threaded-inserts', label: 'Threaded Inserts' },
      { id: 'cable-management', label: 'Cable Management' },
    ],
  },
  {
    id: 'audio-jack',
    label: 'External Interfaces',
    children: [
      { id: 'audio-jack', label: 'Audio Output Connector' },
      { id: 'radio-cable', label: 'Radio Interface Cable' },
      { id: 'strain-relief', label: 'Cable Strain Relief' },
    ],
  },
]

const TREE_COUNT = TREE.reduce((a, n) => a + 1 + (n.children?.length ?? 0), 0) + 40

const AUDIO_CHAIN = new Set([
  'mic-voice',
  'mic-ref',
  'acoustic-duct',
  'acoustic-mesh',
  'acoustic-gasket',
  'audio-adc',
  'audio-dac',
  'analog-filter',
  'esp32',
  'audio-jack',
  'audio-harness',
  'radio-cable',
  'host-radio',
])

/* ================================================================== */
/*  primitives                                                         */
/* ================================================================== */
function Btn({
  active,
  onClick,
  children,
  tone = 'sky',
  title,
  pulse,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  tone?: 'sky' | 'amber'
  title?: string
  pulse?: boolean
}) {
  return (
    <button title={title} onClick={onClick} className={`btn ${tone} ${active ? 'on' : ''} ${pulse ? 'btn-pulse' : ''}`}>
      {children}
    </button>
  )
}

function Icon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${className}`} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  cube: 'M12 2.6 20 7v10l-8 4.4L4 17V7l8-4.4M4 7l8 4.4M20 7l-8 4.4M12 11.4v10',
  layers: 'M12 3 3 7.5l9 4.5 9-4.5L12 3M3 12.5l9 4.5 9-4.5M3 17l9 4.5 9-4.5',
  slice: 'M4 4h16v16H4zM12 4v16M4 12h16',
  chip: 'M7 7h10v10H7zM4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12m9.5 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2',
  tag: 'M20.5 12.5 12 21l-9-9V3h9zM7.5 7.5h.01',
  flow: 'M6 4h12M6 12h12M6 20h12M9 4v4M15 12v4',
  rotate: 'M21 12a9 9 0 1 1-3-6.7M21 3v6h-6',
  zoomIn: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3M11 8v6M8 11h6',
  zoomOut: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3M8 11h6',
  reset: 'M3 12a9 9 0 1 0 3-6.7M3 3v6h6',
  play: 'M7 4.5v15l13-7.5z',
  pause: 'M9 5v14M15 5v14',
  stop: 'M7 7h10v10H7z',
  iso: 'M12 2.5 21 7v10l-9 4.5L3 17V7z',
  front: 'M4 4h16v16H4zM8 8h8v8H8z',
  top: 'M4 9h16l-2-5H6zM4 9v11h16V9zM4 13h16',
  rear: 'M4 6h16v12H4zM9 6v12M15 6v12',
  side: 'M6 4h12v16H6zM6 10h12M6 15h12',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9 6.3 17.7',
  chev: 'm9 6 6 6-6 6',
  shield: 'M12 2.5 20 5.5v6.2c0 4.6-3.4 8.4-8 9.8-4.6-1.4-8-5.2-8-9.8V5.5z',
  ruler: 'M3 17 17 3l4 4L7 21zM6.5 13.5l1.8 1.8M9.5 10.5l1.8 1.8M12.5 7.5l1.8 1.8',
  focus:
    'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M3 8V4h4M21 8V4h-4M3 16v4h4M21 16v4h-4',
  flip: 'M4 8h12a4 4 0 0 1 0 8H9m0 0 3-3m-3 3 3 3M4 8l3-3M4 8l3 3',
  move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
}

/* ================================================================== */
/*  assembly tree                                                      */
/* ================================================================== */
function TreeRow({
  node,
  depth,
  collapsed,
  toggle,
  forceOpen,
}: {
  node: Node
  depth: number
  collapsed: Set<string>
  toggle: (k: string) => void
  forceOpen: boolean
}) {
  const { selected, setSelected, setHovered, hovered } = useViewer()
  const open = forceOpen || !collapsed.has(node.label + depth)
  const active = selected === node.id
  const hov = hovered === node.id
  return (
    <div>
      <div
        onClick={() => setSelected(node.id)}
        onMouseEnter={() => setHovered(node.id)}
        onMouseLeave={() => setHovered(null)}
        style={{ paddingLeft: 8 + depth * 13 }}
        className={`group flex cursor-pointer items-center gap-1.5 border-l-2 py-[3.5px] pr-2 transition-colors ${
          active
            ? 'border-sky-400 bg-sky-500/10'
            : hov
              ? 'border-slate-500 bg-slate-100/5'
              : 'border-transparent hover:border-slate-700 hover:bg-slate-100/[0.03]'
        }`}
      >
        {node.children ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggle(node.label + depth)
            }}
            className="text-slate-500 transition-transform hover:text-sky-300"
            style={{ transform: open ? 'rotate(90deg)' : 'none' }}
          >
            <Icon d={ICONS.chev} className="h-3 w-3" />
          </button>
        ) : (
          <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-slate-600 group-hover:bg-sky-400" />
        )}
        <span
          className={`truncate font-mono text-[10px] tracking-wide ${
            active ? 'text-sky-200' : node.children ? 'font-semibold text-slate-200' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        >
          {node.label}
        </span>
        {node.children && (
          <span className="ml-auto font-mono text-[8.5px] text-slate-600">{node.children.length}</span>
        )}
      </div>
      {open && node.children?.map((c) => (
        <TreeRow key={c.id + c.label} node={c} depth={depth + 1} collapsed={collapsed} toggle={toggle} forceOpen={forceOpen} />
      ))}
    </div>
  )
}

function AssemblyTree() {
  const [q, setQ] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = useCallback((k: string) => {
    setCollapsed((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }, [])
  const query = q.trim().toLowerCase()
  const filter = (n: Node): Node | null => {
    if (!query) return n
    const kids = (n.children ?? []).map(filter).filter(Boolean) as Node[]
    if (n.label.toLowerCase().includes(query) || kids.length) return { ...n, children: kids.length ? kids : undefined }
    return null
  }
  const rows = TREE.map(filter).filter(Boolean) as Node[]
  return (
    <div className="panel overflow-hidden">
      <div className="panel-hd">
        <span>Assembly Tree</span>
        <span className="text-slate-500">{TREE_COUNT} parts</span>
      </div>
      <div className="border-b border-slate-800/70 px-2 py-1.5">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter components…"
          className="w-full rounded-sm border border-slate-800 bg-slate-950/60 px-2 py-1 font-mono text-[10px] text-slate-200 outline-none focus:border-sky-600"
        />
      </div>
      <div className="scroll-thin max-h-[32vh] overflow-y-auto py-1.5">
        <div className="flex items-center gap-1.5 px-2.5 pb-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-sky-500/20 text-sky-300">
            <Icon d={ICONS.shield} className="h-3 w-3" />
          </span>
          <span className="font-mono text-[10.5px] font-bold tracking-[0.14em] text-slate-100">SHIELD-COM</span>
        </div>
        {rows.map((n, i) => (
          <TreeRow key={i + n.label} node={n} depth={1} collapsed={collapsed} toggle={toggle} forceOpen={!!query} />
        ))}
        {!rows.length && (
          <div className="px-3 py-3 font-mono text-[10px] text-slate-500">no match for “{q}”</div>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/*  information panel                                                  */
/* ================================================================== */
function InfoPanel() {
  const { selected, setSelected, focus, setLabels, labels } = useViewer()
  const info = selected ? PARTS[selected] : null

  if (!info) {
    return (
      <div className="panel overflow-hidden">
        <div className="panel-hd">
          <span>Component Inspector</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-sky-400" /> idle
          </span>
        </div>
        <div className="hatch px-3 py-4">
          <p className="text-[11px] leading-relaxed text-slate-400">
            Select any component — in the 3D model, the assembly tree, the callouts or the architecture
            flow. The part is highlighted, the rest of the assembly dims and the camera moves to an
            inspection angle.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 font-mono text-[9px] tracking-wider text-slate-500">
            <span>DRAG · ORBIT</span>
            <span>SCROLL · ZOOM</span>
            <span>RIGHT-DRAG · PAN</span>
            <span>CLICK · INSPECT</span>
          </div>
        </div>
      </div>
    )
  }

  const facts = [
    { k: 'FUNCTION', v: info.func },
    { k: 'LOCATION', v: info.loc },
    { k: 'ROLE IN SYSTEM', v: info.role },
  ]
  return (
    <div className="panel fade-up overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.16em] text-sky-400">
            <span className="inline-block h-1 w-1 rounded-full bg-sky-400" />
            {info.branch.toUpperCase()}
          </div>
          <h2 className="mt-1 text-[13px] font-bold leading-tight tracking-wide text-slate-50">{info.name}</h2>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className={`chip ${info.kind === 'dsp' ? 'violet' : 'sky'}`}>
              {info.kind === 'dsp' ? 'SOFTWARE / DSP' : 'PHYSICAL COMPONENT'}
            </span>
            {AUDIO_CHAIN.has(selected!) && <span className="chip amber">AUDIO SIGNAL PATH</span>}
          </div>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="btn ghost shrink-0"
          title="clear selection"
        >
          ✕
        </button>
      </div>

      <div className="scroll-thin max-h-[48vh] overflow-y-auto px-3 py-3">
        {/* COMPONENT SPECIFICATION CARD */}
        {info.specs && (
          <div className="mb-3 rounded border border-sky-500/30 bg-sky-950/20 p-2 text-[10px]">
            <div className="font-mono text-[8px] font-bold tracking-[0.18em] text-sky-300 uppercase mb-1.5 flex items-center justify-between">
              <span>Datasheet Specifications</span>
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 gap-1 font-mono text-[9.5px]">
              {info.specs.mfrPart && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">PART:</span>
                  <span className="text-sky-200 font-semibold text-right">{info.specs.mfrPart}</span>
                </div>
              )}
              {info.specs.dimensions && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">DIMENSIONS:</span>
                  <span className="text-amber-200 font-semibold text-right">{info.specs.dimensions}</span>
                </div>
              )}
              {info.specs.package && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">PACKAGE:</span>
                  <span className="text-slate-200 text-right">{info.specs.package}</span>
                </div>
              )}
              {info.specs.voltage && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">VOLTAGE:</span>
                  <span className="text-emerald-300 text-right">{info.specs.voltage}</span>
                </div>
              )}
              {info.specs.weight && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">WEIGHT:</span>
                  <span className="text-slate-200 text-right">{info.specs.weight}</span>
                </div>
              )}
              {info.specs.material && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">MATERIAL:</span>
                  <span className="text-slate-200 text-right">{info.specs.material}</span>
                </div>
              )}
              {info.specs.temperature && (
                <div className="flex justify-between border-b border-sky-900/30 pb-0.5">
                  <span className="text-slate-400">OPERATING TEMP:</span>
                  <span className="text-slate-200 text-right">{info.specs.temperature}</span>
                </div>
              )}
              {info.specs.interface && (
                <div className="mt-1 pt-1 border-t border-sky-900/40 text-[9px] leading-tight text-slate-300">
                  <span className="text-sky-400 font-semibold">I/O INTERFACE: </span>
                  {info.specs.interface}
                </div>
              )}
            </div>
          </div>
        )}

        <dl className="space-y-2.5">
          {facts.map((f) => (
            <div key={f.k}>
              <dt className="font-mono text-[8.5px] tracking-[0.18em] text-slate-500">{f.k}</dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-slate-200">{f.v}</dd>
            </div>
          ))}
          <div>
            <dt className="font-mono text-[8.5px] tracking-[0.18em] text-slate-500">TECHNICAL DETAILS</dt>
            <dd className="mt-1.5 space-y-1.5">
              {info.details.map((d, i) => (
                <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
                  <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-sky-500/80" />
                  <span>{d}</span>
                </div>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-800/80 px-3 py-2">
        <Btn
          onClick={() =>
            selected === 'host-radio'
              ? focus([26, 16, 34], info.focus, 0.9)
              : focus([info.focus[0] + 2.4, info.focus[1] + 2.2, info.focus[2] + 3.2], info.focus, 0.9)
          }
        >
          <Icon d={ICONS.zoomIn} /> FOCUS
        </Btn>
        <Btn active={labels} onClick={() => setLabels(!labels)} tone="sky">
          <Icon d={ICONS.tag} /> LABELS
        </Btn>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  system architecture — interactive flow                             */
/* ================================================================== */
function Architecture() {
  const { selected, setSelected, setHovered, setArch } = useViewer()
  const [run, setRun] = useState(false)
  const [step, setStep] = useState(-1)
  const hoverId = (id?: string) => {
    if (!id) return
    setHovered(id)
    document.body.style.cursor = 'pointer'
  }

  useEffect(() => {
    if (!run) {
      setStep(-1)
      return
    }
    setStep(0)
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= FLOW.length - 1) {
          setRun(false)
          return s
        }
        return s + 1
      })
    }, 1250)
    return () => clearInterval(t)
  }, [run])

  useEffect(() => {
    if (step >= 0 && FLOW[step]?.id) setHovered(FLOW[step].id!)
  }, [step, setHovered])

  useEffect(() => () => setHovered(null), [setHovered])

  const count = { physical: 0, software: 0 }
  FLOW.forEach((n) => (count[n.kind === 'software' ? 'software' : 'physical'] += 1))

  return (
    <div className="panel fade-up overflow-hidden">
      <div className="panel-hd">
        <span>System Architecture</span>
        <button onClick={() => setArch(false)} className="btn ghost">
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-slate-800/70 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="chip">▬ {count.physical} PHYSICAL</span>
          <span className="chip violet">▬ {count.software} SOFTWARE</span>
        </div>
        <Btn active={run} tone="amber" onClick={() => setRun(!run)}>
          {run ? <Icon d={ICONS.pause} /> : <Icon d={ICONS.play} />} {run ? 'PAUSE' : 'RUN FLOW'}
        </Btn>
      </div>

      <div className="scroll-thin max-h-[38vh] overflow-y-auto px-3 py-2.5" onMouseLeave={() => setHovered(null)}>
        {FLOW.map((n, i) => {
          const isSw = n.kind === 'software'
          const isIo = n.kind === 'io'
          const on = selected && n.id && n.id === selected && PARTS[selected]
          const active = step === i
          return (
            <div key={i}>
              {i > 0 && (
                <div className="flex h-4 items-center pl-[11px]">
                  <svg width="10" height="16" className="overflow-visible">
                    <line
                      x1="3"
                      y1="0"
                      x2="3"
                      y2="16"
                      stroke={active || step === i - 1 ? '#d9bd81' : '#4a5141'}
                      strokeWidth="1.4"
                      className={run ? 'flow-dash' : ''}
                    />
                  </svg>
                </div>
              )}
              <button
                onMouseEnter={() => n.id !== 'host-radio' && hoverId(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => n.id && n.id !== 'host-radio' && setSelected(n.id)}
                className={`group w-full rounded-sm border px-2.5 py-1.5 text-left transition-all ${
                  isSw
                    ? 'border-dashed border-violet-500/60 bg-violet-500/[0.09] hover:bg-violet-500/[0.18]'
                    : isIo
                      ? 'border-dashed border-slate-600 bg-slate-100/[0.03] hover:bg-slate-100/[0.07]'
                      : 'border-slate-700 bg-gradient-to-b from-slate-800/70 to-slate-900/70 hover:from-slate-700/70'
                } ${on ? 'ring-1 ring-sky-400/70' : ''} ${active ? 'ring-2 ring-sky-400/80' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-[8px] tabular-nums ${isSw ? 'text-violet-300/80' : 'text-slate-500'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold tracking-wider ${
                      isSw ? 'text-violet-200' : 'text-slate-100'
                    }`}
                  >
                    {n.label}
                  </span>
                </div>
                {n.sub && <div className="mt-0.5 pl-6 text-[9.5px] leading-snug text-slate-400">{n.sub}</div>}
              </button>
            </div>
          )
        })}
      </div>

      <p className="border-t border-slate-800/70 px-3 py-2.5 font-mono text-[9px] leading-relaxed text-slate-500">
        AI / noise suppression = embedded software + DSP running on the ESP32 and its audio hardware.
        SHIELD-COM has <span className="text-slate-300">no separate “AI processor”</span> and{' '}
        <span className="text-slate-300">no RF transmitter</span> — the host radio keeps all transmit /
        receive functions.
      </p>
    </div>
  )
}

/* ================================================================== */
/*  material legend                                                    */
/* ================================================================== */
const LEGEND = [
  ['#2b2f34', 'Graphite polymer'],
  ['#141619', 'Elastomer / rubber'],
  ['#10241c', 'PCB soldermask'],
  ['#b0b8c0', 'Satin metal / shield'],
  ['#111316', 'Semiconductor'],
  ['#b9954a', 'Brass / ENIG gold'],
  ['#343b57', 'Li-ion pack'],
  ['#4a5839', 'Host radio (ref.)'],
]

function Legend() {
  const [open, setOpen] = useState(false)
  return (
    <div className="panel w-[196px] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="panel-hd w-full">
        <span>Materials</span>
        <Icon d={ICONS.chev} className={open ? 'h-3 w-3 rotate-90' : 'h-3 w-3'} />
      </button>
      {open && (
        <div className="space-y-1 px-2.5 py-2">
          {LEGEND.map(([c, l]) => (
            <div key={l} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/60"
                style={{ background: c, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
              />
              <span className="font-mono text-[9px] tracking-wide text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  PCB inspection — front / back board views                          */
/* ================================================================== */
const BOM: [string, string, string][] = [
  ['U1', 'ESP32-S3-WROOM-1', '25.5 × 18.0 × 3.1 mm'],
  ['U2', 'ES7210 audio ADC', 'QFN-20 · 4.0 × 4.0 mm'],
  ['U3', 'ES8311 codec / driver', 'QFN-20 · 3.0 × 3.0 mm'],
  ['U4', 'MCP73871 charger', 'QFN-20 · 4.0 × 4.0 mm'],
  ['U5', 'TPS62260 buck 3V3', 'SOT-23-6 · 2.9 × 2.8 mm'],
  ['U6', 'TPS7A20 LDO 1V8', 'SOT-23-5 · 2.9 × 2.8 mm'],
  ['U7', 'W25Q128JV 16 MB', 'WSON-8 · 6.0 × 5.0 mm'],
  ['Y1', '12.288 MHz XO', '3.2 × 2.5 mm'],
  ['MK1/2', 'SPU0410LR5H MEMS', '3.76 × 3.0 × 1.1 mm'],
]

function PcbPanel() {
  const { mode, setMode, pcbFace, setPcbFace, pcbExplode, setPcbExplode, focus, setSelected } = useViewer()
  const active = mode === 'pcb'

  const goFace = (f: 'top' | 'bottom') => {
    setSelected(null)
    if (!active) setMode('pcb')
    setPcbFace(f)
    focus(f === 'top' ? [0.4, 9.4, 5.2] : [0.4, -8.6, 5.2], [0, 0.36, -0.2], 1.1)
  }

  return (
    <div className="panel overflow-hidden">
      <div className="panel-hd">
        <span>PCB Inspection</span>
        <span className={active ? 'text-sky-400' : 'text-slate-600'}>
          {active ? (pcbFace === 'top' ? 'COMPONENT SIDE' : 'SOLDER SIDE') : 'IDLE'}
        </span>
      </div>

      <div className="px-2.5 py-2">
        <div className="seg w-full">
          <button onClick={() => goFace('top')} className={`btn flex-1 justify-center ${active && pcbFace === 'top' ? 'on' : ''}`}>
            FRONT · TOP
          </button>
          <button onClick={() => goFace('bottom')} className={`btn flex-1 justify-center ${active && pcbFace === 'bottom' ? 'on' : ''}`}>
            BACK · SOLDER
          </button>
        </div>

        <div className="mt-1.5 flex gap-1.5">
          <Btn active={pcbExplode} onClick={() => setPcbExplode(!pcbExplode)} title="Lift components by real package height">
            <Icon d={ICONS.layers} /> {pcbExplode ? 'STACK ON' : 'EXPLODE PCB'}
          </Btn>
          <Btn
            onClick={() => {
              setPcbExplode(false)
              setPcbFace('top')
              setSelected(null)
            }}
          >
            <Icon d={ICONS.reset} /> RESET
          </Btn>
        </div>

        <div className="mt-2 rounded-sm border border-slate-800 bg-slate-950/50 px-2 py-1.5">
          <div className="font-mono text-[8.5px] tracking-[0.16em] text-slate-500">BOARD</div>
          <div className="mt-0.5 font-mono text-[9.5px] text-slate-200">SC-PCB-A3 · REV C</div>
          <div className="font-mono text-[9px] text-slate-400">60.5 × 36 × 1.6 mm · 4-layer FR-4 · ENIG</div>
          <div className="font-mono text-[8.5px] text-slate-500">L1 SIG · L2 GND · L3 PWR · L4 SIG</div>
        </div>

        <div className="scroll-thin mt-2 max-h-[22vh] overflow-y-auto">
          <table className="w-full border-collapse">
            <tbody>
              {BOM.map(([ref, part, pkg]) => (
                <tr key={ref} className="border-b border-slate-800/50 last:border-0">
                  <td className="py-1 pr-1.5 align-top font-mono text-[9px] font-bold text-sky-400">{ref}</td>
                  <td className="py-1 align-top">
                    <div className="font-mono text-[9px] text-slate-200">{part}</div>
                    <div className="font-mono text-[8px] text-slate-500">{pkg}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 font-mono text-[8.5px] leading-relaxed text-slate-500">
          Solder side carries mirrored decoupling, series termination and the TP1–TP8 probe field —
          no active devices, as on the real board.
        </p>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  true-scale comparison (datasheet-derived)                          */
/* ================================================================== */
const SCALE_ROWS: [string, string, string][] = [
  ['SHIELD-COM', '72 × 50 × 26.5 mm', '≈ 95 cm³ · ≈ 96 g'],
  ['HOST RADIO*', '230 × 75 × 43 mm', '≈ 740 cm³ · 940 g'],
  ['RADIO WHIP', '≈ 350 mm flexible', 'short tactical antenna'],
  ['PCB', '60.5 × 36 × 1.6 mm', '4-layer FR-4'],
  ['ESP32-S3 MODULE', '20.5 × 15.4 × 2.4 mm', 'MINI-1 footprint'],
  ['BATTERY', '42 × 28 × 5.6 mm', '700 mAh pouch'],
]

function ScalePanel() {
  const { dims, setDims, focus } = useViewer()
  const [open, setOpen] = useState(true)
  return (
    <div className="panel w-[250px] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="panel-hd w-full">
        <span>True-Scale Comparison</span>
        <Icon d={ICONS.chev} className={open ? 'h-3 w-3 rotate-90' : 'h-3 w-3'} />
      </button>
      {open && (
        <div className="px-2.5 py-2">
          <table className="w-full border-collapse">
            <tbody>
              {SCALE_ROWS.map(([k, v, s]) => (
                <tr key={k} className="border-b border-slate-800/60 last:border-0">
                  <td className="py-1 pr-1 align-top font-mono text-[8.5px] tracking-wider text-slate-500">{k}</td>
                  <td className="py-1 text-right align-top">
                    <div className="font-mono text-[9.5px] text-slate-200">{v}</div>
                    <div className="font-mono text-[8px] text-slate-500">{s}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {[
              ['3.2×', 'LENGTH'],
              ['7.8×', 'VOLUME'],
              ['≈10×', 'MASS'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-sm border border-amber-500/30 bg-amber-500/[0.07] px-1.5 py-1 text-center">
                <div className="font-mono text-[12px] font-bold text-amber-200">{n}</div>
                <div className="font-mono text-[7.5px] tracking-[0.16em] text-amber-400/80">RADIO : MODULE {l}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[8.5px] leading-relaxed text-slate-500">
            Module footprint ≈ 78 % of a credit card (85.6 × 54 mm), 26.5 mm thick — it hangs off the
            radio like a compact speaker-mic. *Radmor 3501-class VHF handheld, manufacturer datasheet:
            230 × 91/75 × 43 mm with battery, 940 g.
          </p>
          <div className="mt-2 flex gap-1.5">
            <Btn active={dims} onClick={() => setDims(!dims)}>
              <Icon d={ICONS.ruler} /> {dims ? 'DIMENSIONS ON' : 'SHOW DIMENSIONS'}
            </Btn>
            <Btn onClick={() => focus([24, 14, 30], [10.6, 9, 0], 1.0)} title="Frame the host radio">
              RADIO
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================================================================== */
/*  loader                                                             */
/* ================================================================== */
function Loader({ ready }: { ready: boolean }) {
  const { progress } = useProgress()
  const [hidden, setHidden] = useState(false)
  const [minTime, setMinTime] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinTime(true), 1000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (minTime && ready) {
      const t = setTimeout(() => setHidden(true), 300)
      return () => clearTimeout(t)
    }
  }, [minTime, ready])
  if (hidden) return null
  const pct = ready ? Math.max(progress, 100) : Math.max(14, progress)
  const done = minTime && ready
  return (
    <div
      className={`absolute inset-0 z-50 grid place-items-center bg-[#090c0a] transition-opacity duration-500 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-[260px] text-center">
        <div className="relative mx-auto grid h-16 w-16 place-items-center">
          <svg viewBox="0 0 64 64" className="boot-ring absolute inset-0 h-16 w-16">
            <circle cx="32" cy="32" r="29" fill="none" stroke="#cba86a" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="26 130" strokeLinecap="round" />
          </svg>
          <svg viewBox="0 0 64 64" className="boot-ring2 absolute inset-0 h-16 w-16">
            <circle cx="32" cy="32" r="24" fill="none" stroke="#d9bd81" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="10 60" strokeLinecap="round" />
          </svg>
          <div className="grid h-11 w-11 place-items-center rounded-sm border border-sky-500/40 bg-sky-500/10 text-sky-300">
            <Icon d={ICONS.shield} className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 font-mono text-[15px] font-extrabold tracking-[0.2em] text-slate-100">
          SHIELD-COM
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-[0.16em] text-slate-500">
          BUILDING ENGINEERING MODEL
        </div>
        <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-[width] duration-500"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="mt-2 font-mono text-[9px] tracking-widest text-slate-600">
          {String(Math.round(Math.min(100, pct))).padStart(3, '0')}%
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  shells                                                             */
/* ================================================================== */
const MODES: { id: Mode; label: string; icon: string; hint: string }[] = [
  { id: 'assembled', label: 'ASSEMBLED', icon: ICONS.cube, hint: 'Fully closed field configuration' },
  { id: 'exploded', label: 'EXPLODED', icon: ICONS.layers, hint: 'Controlled separation along the assembly axis' },
  { id: 'slice', label: 'SLICE', icon: ICONS.slice, hint: 'Movable section plane through the enclosure' },
  { id: 'pcb', label: 'PCB DETAIL', icon: ICONS.chip, hint: 'Second-level vertical explode of the board' },
  { id: 'internal', label: 'INTERNAL', icon: ICONS.eye, hint: 'X-ray enclosure, internals opaque' },
]

function DemoTimeline() {
  const { demoT, setDemoPaused, demoPaused, seekDemo, setDemo, restartRef, demoChapter } = useViewer()
  return (
    <div className="panel w-[min(520px,92vw)] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="chip amber">
          <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> DEMO
        </span>
        <span className="font-mono text-[9px] tracking-[0.14em] text-slate-400">
          {CHAPTERS[demoChapter]?.name ?? ''}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => {
              restartRef.current = true
              setDemoPaused(false)
            }}
            className="btn ghost"
          >
            <Icon d={ICONS.reset} /> RESTART
          </button>
          <button onClick={() => setDemoPaused(!demoPaused)} className="btn">
            {demoPaused ? <Icon d={ICONS.play} /> : <Icon d={ICONS.pause} />}
            {demoPaused ? 'PLAY' : 'PAUSE'}
          </button>
          <button onClick={() => setDemo(false)} className="btn">
            <Icon d={ICONS.stop} /> EXIT
          </button>
        </div>
      </div>

      <div className="relative mt-2.5 h-9">
        <div
          className="absolute inset-x-0 top-3 h-[3px] cursor-pointer rounded-full bg-slate-800"
          onClick={(e) => {
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const u = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
            const t = u * DEMO_END
            let idx = 0
            CHAPTERS.forEach((c, i) => {
              if (t >= c.t) idx = i
            })
            seekDemo(idx)
          }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400/80 to-sky-400"
            style={{ width: `${(demoT / DEMO_END) * 100}%` }}
          />
          <div
            className="absolute -top-[5px] h-[13px] w-[3px] rounded-sm bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]"
            style={{ left: `${(demoT / DEMO_END) * 100}%` }}
          />
          {CHAPTERS.map((c) => (
            <button
              key={c.t}
              title={c.name}
              onClick={(e) => {
                e.stopPropagation()
                seekDemo(CHAPTERS.indexOf(c))
              }}
              className="absolute -top-[4px] h-3 w-[7px] -translate-x-1/2 rounded-sm border border-slate-600 bg-slate-900 transition-colors hover:border-sky-400 hover:bg-sky-500/40"
              style={{ left: `${(c.t / DEMO_END) * 100}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 flex justify-between font-mono text-[8px] text-slate-600">
          {CHAPTERS.map((c) => (
            <span key={c.t} style={{ left: `${(c.t / DEMO_END) * 100}%`, position: 'absolute' }} className="-translate-x-1/2">
              {c.t}s
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-500">
        <span>{CHAPTERS[demoChapter]?.sub ?? ''}</span>
        <span className="tabular-nums">
          {demoT.toFixed(1)} / {DEMO_END.toFixed(1)} s
        </span>
      </div>
    </div>
  )
}

function DemoCaption() {
  const { demoChapter } = useViewer()
  const c = CHAPTERS[demoChapter]
  if (!c) return null
  return (
    <div key={demoChapter} className="cap-in pointer-events-none text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] text-sky-400">
        {String(demoChapter + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[22px] font-extrabold tracking-[0.04em] text-slate-50 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
        {c.name}
      </div>
      <div className="mx-auto mt-1 max-w-[540px] font-mono text-[10px] tracking-[0.12em] text-slate-300/90">
        {c.sub}
      </div>
    </div>
  )
}

const MODE_TOAST: Record<Mode, { label: string; icon: string }> = {
  assembled: { label: 'ASSEMBLED · FIELD CONFIGURATION', icon: ICONS.cube },
  exploded: { label: 'EXPLODED · ASSEMBLY AXIS SEPARATION', icon: ICONS.layers },
  slice: { label: 'SECTION MODE · DRAG THE CUT PLANE', icon: ICONS.slice },
  pcb: { label: 'PCB DETAIL · INSPECTION CHAMBER', icon: ICONS.chip },
  internal: { label: 'INTERNAL · ENCLOSURE X-RAY', icon: ICONS.eye },
}

function ModeToast() {
  const { mode, demo } = useViewer()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const first = useRef(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (demo) return
    timers.current.forEach(clearTimeout)
    setLeaving(false)
    setVisible(true)
    const t1 = setTimeout(() => setLeaving(true), 1600)
    const t2 = setTimeout(() => setVisible(false), 1900)
    timers.current = [t1, t2]
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  if (!visible) return null
  const info = MODE_TOAST[mode]
  return (
    <div className={`pointer-events-none fixed left-1/2 top-6 z-[60] ${leaving ? 'toast-out' : 'toast-in'}`}>
      <div className="flex items-center gap-2 rounded-sm border border-sky-500/40 bg-slate-950/90 px-3.5 py-2 shadow-[0_10px_30px_-10px_rgba(56,189,248,0.5)] backdrop-blur">
        <span className="grid h-5 w-5 place-items-center rounded-sm bg-sky-500/15 text-sky-300">
          <Icon d={info.icon} className="h-3 w-3" />
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-sky-100">{info.label}</span>
      </div>
    </div>
  )
}

function Shell() {
  const {
    mode,
    setMode,
    selected,
    setSelected,
    labels,
    setLabels,
    autoRotate,
    setAutoRotate,
    resetAll,
    clip,
    setClip,
    arch,
    setArch,
    demo,
    setDemo,
    zoomBy,
    viewPreset,
    dims,
    setDims,
    focus,
    setClip: setClipV,
    isolate,
    setIsolate,
    pcbFace,
    setPcbFace,
    setPcbExplode,
    freeMove,
    setFreeMove,
    partOffsets,
    resetPartOffsets,
    assembleAll,
  } = useViewer()

  const [ready, setReady] = useState(false)
  const modeHint = MODES.find((m) => m.id === mode)?.hint ?? ""
  const sel = selected ? PARTS[selected] : null

  /* smooth camera move toward the selected component */
  useEffect(() => {
    if (!selected) return
    const info = PARTS[selected]
    if (!info) return
    const [fx, fy, fz] = info.focus
    if (selected === 'host-radio') {
      focus([26, 16, 34], [fx, fy, fz], 1.1)
      return
    }
    if (selected === 'radio-cable' || selected === 'strain-relief') {
      focus([-4, 14, 22], [fx, fy, fz], 1.0)
      return
    }
    const h = new THREE.Vector3(fx - 0.2, 0, fz)
    if (h.lengthSq() < 0.01) h.set(0.8, 0, 1)
    h.normalize()
    const d = 3.6
    focus([fx + h.x * d + 0.4, fy + 2.7, fz + h.z * d + 3.0], [fx, fy, fz], 0.95)
  }, [selected, focus])

  /* -------- inspection presets (Option A / Option B) -------- */
  const [option, setOption] = useState<'a' | 'b' | null>(null)
  const applyOption = useCallback(
    (o: 'a' | 'b') => {
      setOption(o)
      setSelected(null)
      setDemo(false)
      setAutoRotate(false)
      setPcbFace('top')
      setPcbExplode(false)
      setIsolate(true)
      resetPartOffsets()
      if (o === 'a') {
        /* full true-scale presentation: module + host radio, nothing cut, orbit freely */
        setMode('assembled')
        setLabels(false)
        setArch(false)
        setDims(true)
        setClipV(0.4)
        focus([HOME_POS.x, HOME_POS.y, HOME_POS.z], [HOME_TGT.x, HOME_TGT.y, HOME_TGT.z], 1.3)
      } else {
        /* engineering review: exploded module with callouts + architecture */
        setMode('exploded')
        setLabels(true)
        setArch(true)
        setDims(false)
        setClipV(0.4)
        focus([-9.3, 8.9, 20.3], [0.3, 1.0, -0.1], 1.6)
      }
    },
    [
      focus,
      setArch,
      setAutoRotate,
      setDemo,
      setLabels,
      setMode,
      setSelected,
      setClipV,
      setDims,
      setPcbFace,
      setPcbExplode,
      setIsolate,
      resetPartOffsets,
    ],
  )

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const k = e.key.toLowerCase()
      if (k === 'escape') setSelected(null)
      else if (k === '1') {
        setMode('assembled')
        assembleAll()
      }
      else if (k === '2') {
        setMode('exploded')
        assembleAll()
      }
      else if (k === '3') {
        setMode('slice')
        assembleAll()
      }
      else if (k === '4') {
        setMode('pcb')
        assembleAll()
      }
      else if (k === '5') {
        setMode('internal')
        assembleAll()
      }
      else if (k === 'f') setPcbFace(pcbFace === 'top' ? 'bottom' : 'top')
      else if (k === 'i') setIsolate(!isolate)
      else if (k === 'm') setFreeMove(!freeMove)
      else if (k === 'l') setLabels(!labels)
      else if (k === 'a') setArch(!arch)
      else if (k === 'r') setAutoRotate(!autoRotate)
      else if (k === '0') resetAll()
      else if (k === ' ') {
        e.preventDefault()
        setDemo(!demo)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    labels,
    arch,
    autoRotate,
    demo,
    isolate,
    freeMove,
    pcbFace,
    setLabels,
    setArch,
    setAutoRotate,
    setDemo,
    setSelected,
    setMode,
    setIsolate,
    setFreeMove,
    setPcbFace,
    resetAll,
  ])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#090c0a]">
      {/* studio backdrop */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(1200px 760px at 60% 8%, rgba(203,168,106,0.11), transparent 62%), radial-gradient(1100px 720px at 12% 96%, rgba(28,36,24,0.8), transparent 68%), radial-gradient(900px 620px at 88% 82%, rgba(74,88,57,0.16), transparent 70%), linear-gradient(180deg,#0e130d 0%,#080a07 60%)',
        }}
      />
      <div className="grid-bg pointer-events-none absolute inset-0 z-0 opacity-40" />
      <div className="grain pointer-events-none absolute inset-0 z-[5]" />
      <div
        className="pointer-events-none absolute inset-0 z-[6]"
        style={{
          background:
            'radial-gradient(130% 100% at 50% 45%, transparent 52%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <Canvas
        className="absolute inset-0 z-10"
        shadows
        dpr={[1, 2]}
        gl={{ localClippingEnabled: true, antialias: true }}
        camera={{ position: [HOME_POS.x, HOME_POS.y, HOME_POS.z], fov: 33, near: 0.1, far: 260 }}
        onPointerMissed={() => setSelected(null)}
        onCreated={() => setReady(true)}
      >
        <Scene />
      </Canvas>

      <Loader ready={ready} />
      <ModeToast />

      {/* ambient corner ticks */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 h-4 w-4 border-l border-t border-slate-600/40" />
      <div className="pointer-events-none absolute right-3 top-3 z-20 h-4 w-4 border-r border-t border-slate-600/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 h-4 w-4 border-b border-l border-slate-600/40" />
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 h-4 w-4 border-b border-r border-slate-600/40" />

      {/* ============ header ============ */}
      <header
        className={`absolute left-5 top-5 z-30 transition-all duration-500 ${
          demo ? '-translate-y-6 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-sm border border-sky-500/40 bg-gradient-to-b from-sky-500/20 to-sky-500/5 text-sky-300 shadow-[0_10px_30px_-12px_rgba(56,189,248,0.7)]">
            <Icon d={ICONS.shield} className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[8.5px] tracking-[0.3em] text-sky-400">
              INTERACTIVE 3D ENGINEERING MODEL
            </div>
            <h1 className="title-shimmer mt-0.5 text-[30px] font-extrabold leading-none tracking-[0.03em]">
              SHIELD·COM
            </h1>
            <div className="mt-1 font-mono text-[9.5px] tracking-[0.14em] text-slate-400">
              ESP32 AI VOICE ENHANCEMENT &amp; COMMUNICATION MODULE
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="chip sky">ESP32-S3 CLASS</span>
              <span className="chip">72 × 50 × 26.5 mm · ≈ 96 g</span>
              <span className="chip">1S 700 mAh</span>
              <span className="chip">IP67 SEALED</span>
              <span className="chip amber">TRUE SCALE 1:1 vs 230 mm RADIO</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============ left column ============ */}
      <div
        className={`scroll-thin absolute left-5 top-[196px] z-30 hidden max-h-[calc(100vh-330px)] w-[258px] space-y-3 overflow-y-auto pr-2 transition-all duration-500 lg:block ${
          demo ? '-translate-x-6 opacity-0' : 'opacity-100'
        }`}
      >
        <AssemblyTree />
        <PcbPanel />
        <ScalePanel />
        <Legend />
        <div className="panel px-3 py-2.5">
          <div className="font-mono text-[8.5px] tracking-[0.18em] text-slate-500">ACTIVE VIEW</div>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-slate-100">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {MODES.find((m) => m.id === mode)?.label}
          </div>
          <div className="mt-1 text-[10px] leading-snug text-slate-400">{modeHint}</div>
        </div>
      </div>

      {/* ============ right column ============ */}
      <div
        className={`absolute right-5 top-5 z-30 hidden w-[336px] space-y-3 transition-all duration-500 md:block ${
          demo ? 'translate-x-6 opacity-0' : 'opacity-100'
        }`}
      >
        <InfoPanel />
        {arch && <Architecture />}
      </div>

      {/* ============ demo caption ============ */}
      {demo && (
        <div className="pointer-events-none absolute inset-x-0 top-[15%] z-30 fade-in">
          <DemoCaption />
        </div>
      )}

      {/* ============ bottom dock ============ */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 px-3 pb-4">
        {demo ? (
          <DemoTimeline />
        ) : (
          <>
            {mode === 'slice' && (
              <div className="panel flex w-[min(640px,94vw)] items-center gap-3 px-3 py-2">
                <span className="chip sky">SECTION A–A</span>
                <input
                  type="range"
                  min={-2.62}
                  max={2.62}
                  step={0.01}
                  value={clip}
                  onChange={(e) => setClip(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-14 text-right font-mono text-[9.5px] tabular-nums text-slate-300">
                  {clip.toFixed(2)} dm
                </span>
              </div>
            )}

            <div className="panel flex flex-wrap items-center justify-center gap-2 px-2.5 py-2">
              {/* inspection presets — Option A / Option B */}
              <div className="seg">
                <button
                  onClick={() => applyOption('a')}
                  title="Option A · field presentation: closed product, clean hero camera, no annotations"
                  className={`btn ${option === 'a' ? 'on' : ''}`}
                >
                  <span className="opacity-60">A</span> PRESENTATION
                </button>
                <button
                  onClick={() => applyOption('b')}
                  title="Option B · engineering review: exploded assembly, callouts and architecture flow"
                  className={`btn amber ${option === 'b' ? 'on' : ''}`}
                >
                  <span className="opacity-60">B</span> ENGINEERING
                </button>
              </div>

              {/* view modes */}
              <div className="seg">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    title={m.hint}
                    onClick={() => {
                      setOption(null)
                      setMode(m.id)
                      assembleAll()
                    }}
                    className={`btn ${mode === m.id ? 'on' : ''}`}
                  >
                    <Icon d={m.icon} />
                    {m.label}
                  </button>
                ))}
              </div>

              <span className="hidden h-5 w-px bg-slate-700/70 sm:block" />

              {/* inspection */}
              <Btn active={labels} onClick={() => setLabels(!labels)} title="Engineering callouts with leader lines">
                <Icon d={ICONS.tag} /> {labels ? 'LABELS ON' : 'LABELS'}
              </Btn>
              <Btn active={arch} tone="amber" onClick={() => setArch(!arch)} title="Signal-chain architecture panel">
                <Icon d={ICONS.flow} /> ARCHITECTURE
              </Btn>
              <Btn active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} title="Continuous turntable rotation">
                <Icon d={ICONS.rotate} /> ROTATE
              </Btn>
              <Btn active={dims} onClick={() => setDims(!dims)} title="True-scale dimension lines + 100 mm scale bar">
                <Icon d={ICONS.ruler} /> DIMENSIONS
              </Btn>
              <Btn
                active={isolate}
                onClick={() => setIsolate(!isolate)}
                title="Focus isolation — dim and desaturate every part except the selected one"
              >
                <Icon d={ICONS.focus} /> ISOLATE
              </Btn>
              <Btn
                active={freeMove}
                tone="amber"
                onClick={() => setFreeMove(!freeMove)}
                title="Free Move Mode: grab any component and drag it, or use the X/Y/Z handles"
              >
                <Icon d={ICONS.move} /> FREE MOVE
              </Btn>
              {freeMove && Object.keys(partOffsets).length > 0 && (
                <Btn
                  tone="amber"
                  onClick={() => resetPartOffsets()}
                  title="Return every moved part to its assembled position"
                >
                  <Icon d={ICONS.reset} /> RESET MOVES ({Object.keys(partOffsets).length})
                </Btn>
              )}

              <span className="hidden h-5 w-px bg-slate-700/70 sm:block" />

              {/* presets */}
              <div className="seg">
                {(
                  [
                    ['iso', ICONS.iso, 'Isometric'],
                    ['front', ICONS.front, 'Front'],
                    ['top', ICONS.top, 'Top'],
                    ['side', ICONS.side, 'Side'],
                    ['rear', ICONS.rear, 'Rear'],
                  ] as [('iso' | 'front' | 'top' | 'side' | 'rear'), string, string][]
                ).map(([k, d, t]) => (
                  <button key={k} title={t} onClick={() => viewPreset(k)} className="btn">
                    <Icon d={d} />
                  </button>
                ))}
              </div>

              <button onClick={() => zoomBy(0.72)} className="btn" title="Zoom in">
                <Icon d={ICONS.zoomIn} />
              </button>
              <button onClick={() => zoomBy(1.4)} className="btn" title="Zoom out">
                <Icon d={ICONS.zoomOut} />
              </button>

              <span className="hidden h-5 w-px bg-slate-700/70 sm:block" />

              <Btn
                tone="amber"
                pulse={!selected && mode === 'assembled' && !autoRotate}
                onClick={() => {
                  setSelected(null)
                  setDemo(true)
                }}
                title="30 second scripted presentation"
              >
                <Icon d={ICONS.play} /> DEMO
              </Btn>
              <Btn
                onClick={() => {
                  setOption(null)
                  resetPartOffsets()
                  resetAll()
                }}
                title="Restore the original configuration and reset moved objects"
              >
                <Icon d={ICONS.reset} /> RESET
              </Btn>
            </div>
          </>
        )}

        <div
          className={`pointer-events-none flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[8.5px] tracking-[0.16em] text-slate-500 transition-opacity duration-500 ${
            demo ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <span>DRAG · ORBIT</span>
          <span className="text-slate-700">|</span>
          <span>SCROLL · ZOOM</span>
          <span className="text-slate-700">|</span>
          <span>RIGHT-DRAG · PAN</span>
          <span className="text-slate-700">|</span>
          <span>1–5 · VIEWS</span>
          <span className="text-slate-700">|</span>
          <span>L · LABELS</span>
          <span className="text-slate-700">|</span>
          <span>F · FLIP PCB</span>
          <span className="text-slate-700">|</span>
          <span>I · ISOLATE</span>
          <span className="text-slate-700">|</span>
          <span>M · FREE MOVE</span>
          <span className="text-slate-700">|</span>
          <span>SPACE · DEMO</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">CLICK ANY COMPONENT TO INSPECT</span>
        </div>
      </div>

      {/* ============ selection HUD (mobile / quick) ============ */}
      {sel && !demo && (
        <div className="pointer-events-none absolute left-1/2 top-[104px] z-30 -translate-x-1/2 md:hidden">
          <div className="panel flex items-center gap-2 px-3 py-1.5">
            <span className="pulse inline-block h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-sky-200">{sel.name}</span>
          </div>
        </div>
      )}

      {/* ============ mobile info drawer ============ */}
      <div className="absolute inset-x-3 bottom-[124px] z-30 md:hidden">
        <div className={demo ? 'hidden' : ''}>
          <InfoPanel />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ViewerProvider>
      <Shell />
    </ViewerProvider>
  )
}
