import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html, Line, RoundedBox } from "@react-three/drei";
import { PARTS, PARTS_BY_ID, SYSTEM_COLOR } from "@/data/parts";
import type { PartDef } from "@/data/parts";
import {
  BOARD,
  FIDUCIALS,
  FOOTS,
  LED_POS,
  MOUNT_HOLES,
  PASSIVES,
  SHIELD_CANS,
  TEST_POINTS,
  makeBraidTexture,
  makeBrushedRoughness,
  makeCapTexture,
  makeEsp32ShieldTexture,
  makeKeyLabel,
  makeLidTexture,
  makeMeshTexture,
  makePcbBottomTexture,
  makePcbTexture,
  RadioLcd,
  type Foot,
} from "./pcb";
import { GHOSTED, useViewer } from "./state";
import {
  MENU_ITEMS,
  MENU_VALUES,
  SOS_HOLD_MS,
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
  sosToggle,
  useDevice,
} from "./device";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";

/* ----------------------------- palette ----------------------------- */
const C = {
  shellTop: "#2b3031",
  shellBottom: "#23282a",
  shellDark: "#191d1e",
  gasket: "#0e1110",
  frame: "#4a5250",
  metal: "#aab2b4",
  can: "#c2c9cb",
  pcb: "#0e3826",
  ic: "#16181a",
  gold: "#d3ab55",
  red: "#b5342a",
  olive: "#39422c",
  batt: "#333b45",
  cable: "#4d5443",
  radio: "#2e3427",
};

/* --------------------------- texture cache -------------------------- */
let TEX: {
  pcb: THREE.Texture;
  pcbBottom: THREE.Texture;
  lid: THREE.Texture;
  brushed: THREE.Texture;
  braid: THREE.Texture;
  mesh: THREE.Texture;
  sos: THREE.Texture;
  batt: THREE.Texture;
  radio: THREE.Texture;
  espShield: THREE.Texture;
  can: THREE.Texture;
} | null = null;

function tex() {
  if (!TEX) {
    TEX = {
      pcb: makePcbTexture(),
      pcbBottom: makePcbBottomTexture(),
      lid: makeLidTexture(),
      brushed: makeBrushedRoughness(),
      braid: makeBraidTexture(),
      mesh: makeMeshTexture(),
      sos: makeCapTexture("SOS", "rgba(255,240,235,0.95)"),
      batt: makeCapTexture("Li-ion 1S", "rgba(210,220,225,0.7)"),
      radio: makeCapTexture("UV-82", "rgba(150,255,190,0.9)"),
      espShield: makeEsp32ShieldTexture(),
      can: makeCapTexture("SC-1", "rgba(60,70,72,0.7)"),
    };
  }
  return TEX;
}

/* ------------------------------ helpers ----------------------------- */
type V3 = [number, number, number];

interface BlkProps {
  s: V3;
  p?: V3;
  r?: V3;
  c?: string;
  m?: number;
  ro?: number;
  rounded?: number;
  emissive?: string;
  ei?: number;
  map?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  opacity?: number;
}

function Blk({ s, p = [0, 0, 0], r, c = C.shellTop, m = 0.55, ro = 0.55, rounded = 0, emissive, ei = 0, map, roughnessMap, opacity = 1 }: BlkProps) {
  const mat = (
    <meshStandardMaterial
      color={c}
      metalness={m}
      roughness={ro}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={ei}
      map={map ?? undefined}
      roughnessMap={roughnessMap ?? undefined}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
  if (rounded > 0) {
    return (
      <RoundedBox args={s} position={p} rotation={r} radius={rounded} smoothness={3} castShadow receiveShadow>
        {mat}
      </RoundedBox>
    );
  }
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      {mat}
    </mesh>
  );
}

function Cyl({
  rt,
  rb,
  h,
  p = [0, 0, 0] as V3,
  r,
  seg = 24,
  c = C.metal,
  m = 0.8,
  ro = 0.4,
  emissive,
  ei = 0,
  opacity = 1,
}: {
  rt: number;
  rb?: number;
  h: number;
  p?: V3;
  r?: V3;
  seg?: number;
  c?: string;
  m?: number;
  ro?: number;
  emissive?: string;
  ei?: number;
  opacity?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <cylinderGeometry args={[rt, rb ?? rt, h, seg]} />
      <meshStandardMaterial
        color={c}
        metalness={m}
        roughness={ro}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={ei}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function TubeMesh({ pts, radius, color = C.cable, map, seg = 140 }: { pts: V3[]; radius: number; color?: string; map?: THREE.Texture; seg?: number }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, seg, radius, 14, false);
  }, [pts, radius, seg]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.2} map={map} />
    </mesh>
  );
}

/* ------------------------------- Part ------------------------------- */
interface MatRec {
  m: THREE.MeshStandardMaterial;
  op: number;
  em: THREE.Color | null;
  ei: number;
  /** material was authored as alpha-blended (textured decals) */
  tr: boolean;
  /** live-driven emissive (LCD, LEDs) — never overridden by hover/selection */
  nh: boolean;
}

/** disables orbit while a control is held so a press never turns into a drag */
function useHold() {
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  return useMemo(
    () => ({
      begin(e?: ThreeEvent<PointerEvent>) {
        if (controls) controls.enabled = false;
        if (e) (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
      },
      end(e?: ThreeEvent<PointerEvent>) {
        if (controls) controls.enabled = true;
        if (e) {
          try {
            (e.target as Element | null)?.releasePointerCapture?.(e.pointerId);
          } catch {
            /* already released */
          }
        }
      },
    }),
    [controls],
  );
}

/** a press-able group: sinks along `dir` while held, calls onDown/onUp, and never selects the parent part */
function Pressable({
  p = [0, 0, 0] as V3,
  r,
  dir = [0, -0.06, 0] as V3,
  onDown,
  onUp,
  children,
}: {
  p?: V3;
  r?: V3;
  dir?: V3;
  onDown?: () => void;
  onUp?: () => void;
  children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null!);
  const down = useRef(false);
  const hold = useHold();
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 24);
    const f = down.current ? 1 : 0;
    g.current.position.x += (p[0] + dir[0] * f - g.current.position.x) * k;
    g.current.position.y += (p[1] + dir[1] * f - g.current.position.y) * k;
    g.current.position.z += (p[2] + dir[2] * f - g.current.position.z) * k;
  });
  const release = (e?: ThreeEvent<PointerEvent>) => {
    if (!down.current) return;
    down.current = false;
    hold.end(e);
    onUp?.();
  };
  return (
    <group
      ref={g}
      position={p}
      rotation={r}
      onPointerDown={(e) => {
        e.stopPropagation();
        down.current = true;
        hold.begin(e);
        onDown?.();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        release(e);
      }}
      onLostPointerCapture={() => release()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </group>
  );
}

const tv = new THREE.Vector3();

function Part({ id, children }: { id: string; children: React.ReactNode }) {
  const def = PARTS_BY_ID[id] as PartDef;
  const st = useViewer();
  const grp = useRef<THREE.Group>(null!);
  const mats = useRef<MatRec[]>([]);
  const op = useRef(def.modes.includes("assembled") ? 1 : 0);

  useEffect(() => {
    const list: MatRec[] = [];
    grp.current.traverse((o: THREE.Object3D) => {
      const mm = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!mm) return;
      const arr = Array.isArray(mm) ? mm : [mm];
      for (const raw of arr) {
        const m = raw as THREE.MeshStandardMaterial;
        if (!list.some((r) => r.m === m)) {
          list.push({
            m,
            op: m.opacity,
            em: m.emissive ? m.emissive.clone() : null,
            ei: m.emissiveIntensity ?? 1,
            tr: m.transparent,
            nh: !!(m.userData && m.userData.noHighlight),
          });
        }
      }
    });
    mats.current = list;
  }, []);

  const isSel = st.selected === id;
  const isHov = st.hovered === id;

  useEffect(() => {
    for (const r of mats.current) {
      if (!r.em || r.nh) continue;
      if (isSel) {
        r.m.emissive.set("#f0a93b");
        r.m.emissiveIntensity = 0.45;
      } else if (isHov) {
        r.m.emissive.set("#4fd1e0");
        r.m.emissiveIntensity = 0.4;
      } else {
        r.m.emissive.copy(r.em);
        r.m.emissiveIntensity = r.ei;
      }
    }
  }, [isSel, isHov]);

  const visible = def.modes.includes(st.mode) && (def.system !== "context" || st.showContext);
  const ghost = st.mode === "internal" && GHOSTED.has(id);
  const dimmed = !!st.isolate && def.system !== st.isolate;
  const interactive = visible && !ghost && !dimmed;

  useFrame((_, dt) => {
    const g = grp.current;
    if (!g) return;
    const k = 1 - Math.exp(-dt * 6);

    let ex: V3 = [0, 0, 0];
    if (st.mode === "exploded") ex = def.explode;
    else if (st.mode === "pcb" && st.pcbSpread && def.pcbLift) ex = [0, def.pcbLift, 0];
    tv.set(def.pos[0] + ex[0], def.pos[1] + ex[1], def.pos[2] + ex[2]);
    g.position.lerp(tv, k);

    const target = !visible ? 0 : dimmed ? 0.05 : ghost ? 0.14 : 1;
    op.current += (target - op.current) * (1 - Math.exp(-dt * 7));
    const o = op.current;
    g.visible = o > 0.012;
    for (const r of mats.current) {
      const nv = r.op * o;
      r.m.opacity = nv;
      r.m.transparent = r.tr || nv < 0.995;
      r.m.depthWrite = nv > 0.75;
    }
  });

  const color = SYSTEM_COLOR[def.system];
  const showLabel = st.labels && st.labelSet.has(id) && visible;
  const a = def.anchor ?? [0, 0, 0];
  const d = def.labelDir ?? [0, 1, 0];
  const L = 0.95;
  const end: V3 = [a[0] + d[0] * L, a[1] + d[1] * L, a[2] + d[2] * L];

  return (
    <group
      ref={grp}
      position={def.pos}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        st.setHovered(id);
      }}
      onPointerOut={() => {
        if (st.hovered === id) st.setHovered(null);
      }}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        st.setSelected(st.selected === id ? null : id);
      }}
    >
      {children}
      {showLabel && (
        <group>
          <Line points={[a as V3, end]} color={isSel ? "#f0a93b" : color} lineWidth={1} transparent opacity={0.55} />
          <mesh position={a as V3}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshBasicMaterial color={isSel ? "#f0a93b" : color} />
          </mesh>
          <Html position={end} center distanceFactor={11} zIndexRange={[20, 0]}>
            <div className={`callout ${isSel ? "is-active" : ""}`}>
              <span style={{ color: isSel ? "#ffdba5" : color }}>{def.ref}</span> {def.name}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

/* --------------------------- ENCLOSURE ------------------------------ */
function LowerEnclosure() {
  const t = tex();
  return (
    <Part id="lower-enclosure">
      {/* floor */}
      <Blk s={[7.8, 0.22, 4.4]} p={[0, -0.89, 0]} rounded={0.09} c={C.shellBottom} m={0.62} ro={0.62} roughnessMap={t.brushed} />
      {/* side walls — top land at y = 0.56 carries the gasket */}
      <Blk s={[7.8, 1.56, 0.24]} p={[0, -0.22, 2.08]} rounded={0.07} c={C.shellBottom} m={0.62} ro={0.6} roughnessMap={t.brushed} />
      <Blk s={[7.8, 1.56, 0.24]} p={[0, -0.22, -2.08]} rounded={0.07} c={C.shellBottom} m={0.62} ro={0.6} roughnessMap={t.brushed} />
      <Blk s={[0.24, 1.56, 4.0]} p={[3.78, -0.22, 0]} rounded={0.07} c={C.shellBottom} m={0.62} ro={0.6} />
      <Blk s={[0.24, 1.56, 4.0]} p={[-3.78, -0.22, 0]} rounded={0.07} c={C.shellBottom} m={0.62} ro={0.6} />
      {/* brass threaded inserts — stay in the tray during service */}
      {([[-3.45, -1.85], [3.45, -1.85], [-3.45, 1.85], [3.45, 1.85], [0, -1.85], [0, 1.85]] as [number, number][]).map(([x, z], i) => (
        <Cyl key={i} rt={0.13} h={0.34} p={[x, 0.38, z]} c="#b9913f" m={0.95} ro={0.35} seg={12} />
      ))}
      {/* cable exit bosses */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 3.95, -0.2, 0]}>
          <Cyl rt={0.42} h={0.36} r={[0, 0, Math.PI / 2]} c={C.shellDark} m={0.7} ro={0.45} />
          <Cyl rt={0.3} h={0.5} r={[0, 0, Math.PI / 2]} c="#0b0d0d" m={0.3} ro={0.9} />
        </group>
      ))}
      {/* USB-C service port — sealed opening with a reinforced bezel */}
      <group position={[-2.35, 0.325, -2.16]}>
        <Blk s={[1.36, 0.46, 0.1]} rounded={0.05} c="#39403f" m={0.82} ro={0.38} />
        <Blk s={[1.02, 0.26, 0.09]} p={[0, 0, -0.025]} rounded={0.04} c="#07090a" m={0.2} ro={0.95} />
        <Blk s={[0.7, 0.06, 0.05]} p={[0, 0, -0.035]} c="#626b6d" m={0.9} ro={0.35} />
      </group>
      {/* mounting lugs */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.95, -0.9, -2.32]}>
          <Blk s={[0.9, 0.18, 0.62]} rounded={0.07} c={C.shellBottom} m={0.6} ro={0.6} />
          <Cyl rt={0.14} h={0.24} p={[0, 0, -0.14]} c={C.shellDark} m={0.75} ro={0.4} />
        </group>
      ))}
      {/* bottom data plate */}
      <Blk s={[3.0, 0.02, 1.1]} p={[0, -1.005, 0]} c="#15191a" m={0.4} ro={0.75} />
      {/* pressure-equalisation vent on the rear wall (ePTFE membrane behind a mesh cap) */}
      <group position={[2.9, -0.15, 2.2]} rotation={[Math.PI / 2, 0, 0]}>
        <Cyl rt={0.2} h={0.08} c="#30373a" m={0.85} ro={0.4} seg={22} />
        <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 20]} />
          <meshStandardMaterial map={t.mesh} color="#8a938f" roughness={0.9} metalness={0.3} />
        </mesh>
      </group>
      {/* tether anchor pin for the USB-C plug */}
      <Cyl rt={0.06} h={0.14} p={[-1.5, 0.2, -2.2]} r={[Math.PI / 2, 0, 0]} c="#6b7476" m={0.9} ro={0.35} seg={10} />
    </Part>
  );
}

function UsbPlug() {
  const tether: V3[] = [
    [-1.5, 0.2, -2.24],
    [-1.52, 0.1, -2.36],
    [-1.55, -0.05, -2.4],
    [-1.55, -0.2, -2.36],
  ];
  return (
    <Part id="usb-plug">
      <TubeMesh pts={tether} radius={0.03} color="#1b1e1e" seg={20} />
      {/* plug hanging open on its tether, below the port */}
      <group position={[-1.55, -0.42, -2.34]} rotation={[0, 0, Math.PI / 2]}>
        <Blk s={[0.5, 0.22, 0.2]} rounded={0.05} c="#1b1e1e" m={0.15} ro={0.9} />
        <Blk s={[0.14, 0.34, 0.26]} p={[-0.3, 0, 0]} rounded={0.05} c="#1b1e1e" m={0.15} ro={0.9} />
        <Blk s={[0.44, 0.16, 0.1]} p={[0.03, 0, 0.02]} rounded={0.03} c="#0c0e0e" m={0.15} ro={0.95} />
      </group>
    </Part>
  );
}

function UpperEnclosure() {
  const t = tex();
  return (
    <Part id="upper-enclosure">
      <Blk s={[7.8, 0.2, 4.4]} p={[0, 0.82, 0]} rounded={0.075} c={C.shellTop} m={0.62} ro={0.5} roughnessMap={t.brushed} />
      {/* laser etch layer */}
      <mesh position={[0, 0.9215, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.8, 4.4]} />
        <meshStandardMaterial map={t.lid} transparent opacity={1} roughness={0.45} metalness={0.3} />
      </mesh>
      {/* skirt — laps over the tray wall so the seam reads as a parting line */}
      <Blk s={[7.8, 0.32, 0.24]} p={[0, 0.72, 2.08]} rounded={0.06} c={C.shellTop} m={0.62} ro={0.5} />
      <Blk s={[7.8, 0.32, 0.24]} p={[0, 0.72, -2.08]} rounded={0.06} c={C.shellTop} m={0.62} ro={0.5} />
      <Blk s={[0.24, 0.32, 4.0]} p={[3.78, 0.72, 0]} rounded={0.06} c={C.shellTop} m={0.62} ro={0.5} />
      <Blk s={[0.24, 0.32, 4.0]} p={[-3.78, 0.72, 0]} rounded={0.06} c={C.shellTop} m={0.62} ro={0.5} />
      {/* machined chamfer rails */}
      <Blk s={[7.4, 0.05, 0.1]} p={[0, 0.9, 1.98]} c="#3a4143" m={0.8} ro={0.35} />
      <Blk s={[7.4, 0.05, 0.1]} p={[0, 0.9, -1.98]} c="#3a4143" m={0.8} ro={0.35} />
      {/* machined grip ribs at both cable ends of the lid */}
      {[-1, 1].map((s) =>
        [0, 1, 2].map((i) => (
          <Blk key={`${s}${i}`} s={[0.07, 0.035, 2.6]} p={[s * (3.05 + i * 0.16), 0.935, 0]} rounded={0.015} c="#3a4143" m={0.8} ro={0.4} />
        )),
      )}
      {/* recessed pocket edges around the control panel */}
      <Blk s={[4.7, 0.02, 0.03]} p={[0.35, 0.922, -0.2]} c="#0d1011" m={0.4} ro={0.8} />
    </Part>
  );
}

/** short colour band on a cable, sampled from the same curve so it always sits on the jacket */
function CableBand({ pts, t0, t1, radius, color }: { pts: V3[]; t0: number; t1: number; radius: number; color: string }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const sub: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) sub.push(curve.getPointAt(t0 + ((t1 - t0) * i) / 8));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sub), 12, radius, 14, false);
  }, [pts, t0, t1, radius]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.1} />
    </mesh>
  );
}

function Gasket() {
  return (
    <Part id="gasket">
      <Blk s={[7.62, 0.08, 0.17]} p={[0, 0, 1.96]} c={C.gasket} m={0.05} ro={0.95} />
      <Blk s={[7.62, 0.08, 0.17]} p={[0, 0, -1.96]} c={C.gasket} m={0.05} ro={0.95} />
      <Blk s={[0.17, 0.08, 3.75]} p={[3.66, 0, 0]} c={C.gasket} m={0.05} ro={0.95} />
      <Blk s={[0.17, 0.08, 3.75]} p={[-3.66, 0, 0]} c={C.gasket} m={0.05} ro={0.95} />
    </Part>
  );
}

function Insulator() {
  return (
    <Part id="insulator">
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[5.3, 2.95]} />
        <meshStandardMaterial color="#8a6a2a" metalness={0.25} roughness={0.55} transparent opacity={0.78} side={THREE.DoubleSide} />
      </mesh>
    </Part>
  );
}

function Frame() {
  return (
    <Part id="frame">
      <Blk s={[7.1, 0.28, 0.18]} p={[0, 0.06, 1.82]} c={C.frame} m={0.85} ro={0.4} />
      <Blk s={[7.1, 0.28, 0.18]} p={[0, 0.06, -1.82]} c={C.frame} m={0.85} ro={0.4} />
      <Blk s={[0.18, 0.28, 3.64]} p={[3.46, 0.06, 0]} c={C.frame} m={0.85} ro={0.4} />
      <Blk s={[0.18, 0.28, 3.64]} p={[-3.46, 0.06, 0]} c={C.frame} m={0.85} ro={0.4} />
      {/* cross members sit just under the board, clear of the cell bay */}
      <Blk s={[0.16, 0.13, 3.6]} p={[-1.1, -0.08, 0]} c={C.frame} m={0.85} ro={0.42} />
      <Blk s={[0.16, 0.13, 3.6]} p={[2.2, -0.08, 0]} c={C.frame} m={0.85} ro={0.42} />
      {/* harness channel + cable anchors at both exits */}
      <Blk s={[0.5, 0.12, 0.34]} p={[-3.05, -0.06, -1.2]} c={C.frame} m={0.85} ro={0.45} />
      <Blk s={[0.3, 0.26, 0.5]} p={[3.36, -0.02, 0.9]} c={C.frame} m={0.85} ro={0.45} />
    </Part>
  );
}

function Standoffs() {
  return (
    <Part id="standoffs">
      {MOUNT_HOLES.map(([x, z], i) => (
        <group key={i} position={[x, -0.36, z]}>
          <Cyl rt={0.19} h={0.78} c="#5a615f" m={0.9} ro={0.35} seg={16} />
          <Cyl rt={0.1} h={0.86} c="#2b2f2f" m={0.6} ro={0.5} seg={12} />
        </group>
      ))}
    </Part>
  );
}

function Fasteners() {
  const screws: V3[] = [
    [-3.45, 0.95, -1.85],
    [3.45, 0.95, -1.85],
    [-3.45, 0.95, 1.85],
    [3.45, 0.95, 1.85],
    [0, 0.95, -1.85],
    [0, 0.95, 1.85],
  ];
  return (
    <Part id="fasteners">
      {screws.map((p, i) => (
        <group key={i} position={p}>
          <Cyl rt={0.17} h={0.09} c="#8d9698" m={0.95} ro={0.3} seg={18} />
          <Cyl rt={0.155} h={0.04} p={[0, -0.06, 0]} c="#14100f" m={0.1} ro={0.95} seg={18} />
          <Cyl rt={0.088} h={0.12} p={[0, 0.025, 0]} c="#16191a" m={0.7} ro={0.5} seg={6} />
          <Cyl rt={0.07} h={0.56} p={[0, -0.33, 0]} c="#7d8688" m={0.95} ro={0.35} seg={10} />
        </group>
      ))}
      {/* tamper-evident service seal across the rear centre fastener */}
      <group position={[0, 1.0, 1.85]}>
        <Blk s={[0.62, 0.012, 0.3]} rounded={0.01} c="#e4e7e2" m={0.05} ro={0.85} />
        <Blk s={[0.62, 0.014, 0.05]} p={[0, 0, -0.1]} c="#c93f33" m={0.05} ro={0.85} />
        <Blk s={[0.62, 0.014, 0.05]} p={[0, 0, 0.1]} c="#c93f33" m={0.05} ro={0.85} />
        <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.56, 0.12]} />
          <meshStandardMaterial map={makeKeyLabel("SERVICE SEAL", "", "#1a1d1a", "#1a1d1a", 30)} transparent roughness={0.8} depthWrite={false} />
        </mesh>
      </group>
    </Part>
  );
}

/* ----------------------------- CONTROLS ----------------------------- */
function ControlGuards() {
  // SOS guard frame (rectangular) + MARK guard ring
  return (
    <Part id="control-guards">
      <group position={[-0.95, 1.03, -1.05]}>
        <Blk s={[2.0, 0.3, 0.15]} p={[0, 0, -0.78]} rounded={0.05} c="#31383a" m={0.7} ro={0.45} />
        <Blk s={[2.0, 0.3, 0.15]} p={[0, 0, 0.78]} rounded={0.05} c="#31383a" m={0.7} ro={0.45} />
        <Blk s={[0.15, 0.3, 1.7]} p={[-0.92, 0, 0]} rounded={0.05} c="#31383a" m={0.7} ro={0.45} />
        <Blk s={[0.15, 0.3, 1.7]} p={[0.92, 0, 0]} rounded={0.05} c="#31383a" m={0.7} ro={0.45} />
      </group>
      <group position={[0.75, 1.045, -1.15]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.54, 0.07, 10, 30]} />
          <meshStandardMaterial color="#31383a" metalness={0.7} roughness={0.45} />
        </mesh>
        <Cyl rt={0.6} h={0.2} p={[0, -0.14, 0]} c="#2b3133" m={0.7} ro={0.5} seg={30} />
      </group>
    </Part>
  );
}

function SosControl() {
  const t = tex();
  const hold = useHold();
  const cap = useRef<THREE.Group>(null!);
  const capMat = useRef<THREE.MeshStandardMaterial>(null!);
  const ring = useRef<THREE.MeshBasicMaterial>(null!);
  const holding = useRef(false);
  const fired = useRef(false);

  useFrame(({ clock }, dt) => {
    const d = getDevice();
    const now = performance.now();
    let prog = 0;
    if (d.sosHoldStart) {
      // ramps for a pointer hold AND for a scripted / 2D-deck hold
      prog = Math.min(1, (now - d.sosHoldStart) / SOS_HOLD_MS);
      if (holding.current && prog >= 1 && !fired.current) {
        fired.current = true;
        sosToggle();
      }
    }
    const ty = holding.current || d.sosHoldStart ? -0.075 : 0;
    cap.current.position.y += (ty - cap.current.position.y) * (1 - Math.exp(-dt * 22));
    const pulse = d.sosActive ? 0.6 + 0.4 * Math.sin(clock.elapsedTime * 7) : 0;
    if (capMat.current) capMat.current.emissiveIntensity = Math.max(pulse * 0.9, prog * 0.75);
    if (ring.current) ring.current.opacity = d.sosActive ? 0.18 + 0.22 * pulse : prog * 0.35;
  });

  const release = (e?: ThreeEvent<PointerEvent>) => {
    if (!holding.current) return;
    holding.current = false;
    hold.end(e);
    sosHold(false);
  };

  return (
    <Part id="sos-control">
      <group
        ref={cap}
        onPointerDown={(e) => {
          e.stopPropagation();
          holding.current = true;
          fired.current = false;
          hold.begin(e);
          sosHold(true);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          release(e);
        }}
        onLostPointerCapture={() => release()}
      >
        <RoundedBox args={[1.5, 0.24, 1.16]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial
            ref={capMat}
            color={C.red}
            metalness={0.2}
            roughness={0.42}
            emissive="#ff3b2e"
            emissiveIntensity={0}
            userData={{ noHighlight: true }}
          />
        </RoundedBox>
        <mesh position={[0, 0.1255, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.9]} />
          <meshStandardMaterial map={t.sos} transparent roughness={0.5} />
        </mesh>
        {/* fine anti-slip knurl ridges on the cap */}
        {[-0.44, -0.3, 0.3, 0.44].map((x) => (
          <Blk key={x} s={[0.035, 0.01, 0.8]} p={[x, 0.125, 0]} c="#8e2a22" m={0.2} ro={0.5} />
        ))}
      </group>
      {/* glow ring under the cap when raised / arming */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.85, 1.5]} />
        <meshBasicMaterial ref={ring} color="#ff4b3e" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* boot seal + plunger */}
      <Blk s={[1.6, 0.1, 1.26]} p={[0, -0.15, 0]} rounded={0.04} c="#14100f" m={0.1} ro={0.95} />
      <Cyl rt={0.18} h={0.5} p={[0, -0.4, 0]} c="#22262a" m={0.4} ro={0.6} seg={16} />
    </Part>
  );
}

function MarkControl() {
  const cap = useRef<THREE.Group>(null!);
  const pressedAt = useRef(0);
  useFrame((_, dt) => {
    // travels for a pointer press AND for a scripted / 2D-deck press
    const age = performance.now() - Math.max(pressedAt.current, getDevice().markAt);
    const ty = age < 140 ? -0.06 : 0;
    cap.current.position.y += (ty - cap.current.position.y) * (1 - Math.exp(-dt * 24));
  });
  return (
    <Part id="mark-control">
      <group
        ref={cap}
        onPointerDown={(e) => {
          e.stopPropagation();
          pressedAt.current = performance.now();
          markPress();
        }}
      >
        <Cyl rt={0.42} h={0.22} c={C.olive} m={0.35} ro={0.5} seg={36} />
        <Cyl rt={0.3} h={0.26} p={[0, 0.02, 0]} c="#454f36" m={0.35} ro={0.45} seg={36} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Blk
            key={i}
            s={[0.05, 0.06, 0.28]}
            p={[Math.cos((i / 6) * Math.PI * 2) * 0.2, 0.05, Math.sin((i / 6) * Math.PI * 2) * 0.2]}
            r={[0, (i / 6) * Math.PI * 2, 0]}
            c="#5a6647"
            m={0.35}
            ro={0.45}
          />
        ))}
        {/* centre tactile dot */}
        <Cyl rt={0.06} h={0.03} p={[0, 0.15, 0]} c="#7f8c65" m={0.3} ro={0.5} seg={14} />
      </group>
      <Blk s={[1.0, 0.09, 1.0]} p={[0, -0.14, 0]} rounded={0.04} c="#14100f" m={0.1} ro={0.95} />
      <Cyl rt={0.14} h={0.45} p={[0, -0.36, 0]} c="#22262a" m={0.4} ro={0.6} seg={14} />
    </Part>
  );
}

/* ------------------------ STATUS / ACOUSTICS ------------------------ */
/* ledLevel() lives in ./device so the 2D demo deck shows identical behaviour */

function LedPipes() {
  const tips = useRef<THREE.MeshStandardMaterial[]>([]);
  const cores = useRef<THREE.MeshStandardMaterial[]>([]);
  const halos = useRef<THREE.Mesh[]>([]);
  const lamps = useRef<THREE.PointLight[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < LED_POS.length; i++) {
      const v = ledLevel(i, t);
      if (tips.current[i]) tips.current[i].emissiveIntensity = 0.35 + v * 3.4;
      if (cores.current[i]) cores.current[i].emissiveIntensity = 0.2 + v * 1.6;
      if (lamps.current[i]) lamps.current[i].intensity = v * 0.5;
      const h = halos.current[i];
      if (h) {
        (h.material as THREE.MeshBasicMaterial).opacity = 0.05 + v * 0.4;
        const s = 0.85 + v * 0.45;
        h.scale.set(s, s, s);
      }
    }
  });

  return (
    <Part id="led-pipes">
      {/* recessed window strip */}
      <Blk s={[1.24, 0.05, 0.3]} p={[2.05, 0.905, -1.5]} rounded={0.02} c="#0a0d0e" m={0.4} ro={0.85} />
      {LED_POS.map((l, i) => (
        <group key={i} position={[l.x, 0.82, l.z]}>
          <Cyl rt={0.075} h={0.34} c="#cfd6d8" m={0.05} ro={0.2} seg={14} emissive={l.color} ei={1} opacity={0.92} />
          <mesh position={[0, 0.115, 0]}>
            <cylinderGeometry args={[0.088, 0.075, 0.05, 16]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) tips.current[i] = m as THREE.MeshStandardMaterial;
              }}
              color="#f2f7f8"
              emissive={l.color}
              emissiveIntensity={2}
              metalness={0.05}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.2, 12]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) cores.current[i] = m as THREE.MeshStandardMaterial;
              }}
              color={l.color}
              emissive={l.color}
              emissiveIntensity={1}
              transparent
              opacity={0.65}
            />
          </mesh>
          {/* soft bloom disc just above the lid surface */}
          <mesh
            ref={(m) => {
              if (m) halos.current[i] = m as THREE.Mesh;
            }}
            position={[0, 0.16, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.22, 20]} />
            <meshBasicMaterial color={l.color} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight
            ref={(p) => {
              if (p) lamps.current[i] = p as THREE.PointLight;
            }}
            position={[0, 0.3, 0]}
            color={l.color}
            intensity={0.3}
            distance={2.4}
            decay={2}
          />
        </group>
      ))}
    </Part>
  );
}

function AcousticInlets() {
  const t = tex();
  return (
    <Part id="acoustic-inlet">
      {[1.05, 0.15].map((z, i) => (
        <group key={i} position={[2.75, 0.86, z]}>
          <Cyl rt={0.19} h={0.14} c="#20262a" m={0.75} ro={0.4} seg={26} />
          <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.13, 24]} />
            <meshStandardMaterial map={t.mesh} color="#7f8a86" roughness={0.9} metalness={0.3} />
          </mesh>
          {/* duct down to the MEMS pair */}
          <Cyl rt={0.11} h={0.55} p={[0, -0.32, 0]} c="#3d4547" m={0.3} ro={0.7} seg={14} opacity={0.6} />
          <Cyl rt={0.15} h={0.07} p={[0, -0.58, 0]} c="#16181a" m={0.1} ro={0.95} seg={14} />
        </group>
      ))}
    </Part>
  );
}

/* ------------------------------- PCB -------------------------------- */
function Pcb() {
  const t = tex();
  return (
    <Part id="pcb">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOARD.w, BOARD.t, BOARD.d]} />
        <meshStandardMaterial color={C.pcb} metalness={0.15} roughness={0.72} />
      </mesh>
      <mesh position={[0, BOARD.t / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[BOARD.w, BOARD.d]} />
        <meshStandardMaterial map={t.pcb} roughness={0.52} metalness={0.32} />
      </mesh>
      <mesh position={[0, -BOARD.t / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BOARD.w, BOARD.d]} />
        <meshStandardMaterial map={t.pcbBottom} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* gold edge plating strips */}
      <Blk s={[0.03, 0.17, 3.4]} p={[3.3, 0, 0]} c="#8d7a3f" m={0.9} ro={0.45} />
      <Blk s={[0.03, 0.17, 3.4]} p={[-3.3, 0, 0]} c="#8d7a3f" m={0.9} ro={0.45} />
      {/* plated mounting eyelets */}
      {MOUNT_HOLES.map(([x, z], i) => (
        <mesh key={`e${i}`} position={[x, 0.085, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.155, 0.028, 8, 22]} />
          <meshStandardMaterial color="#d8b463" metalness={0.95} roughness={0.3} />
        </mesh>
      ))}
      {/* assembly fiducials */}
      {FIDUCIALS.map(([x, z], i) => (
        <Cyl key={`f${i}`} rt={0.05} h={0.014} p={[x, 0.088, z]} c="#e3c67c" m={0.95} ro={0.28} seg={14} />
      ))}
      {/* edge castellations along the board sides */}
      {Array.from({ length: 13 }).map((_, i) => {
        const x = -3.0 + i * 0.5;
        return (
          <group key={`c${i}`}>
            <Cyl rt={0.035} h={0.18} p={[x, 0, 1.695]} c="#c8a64f" m={0.92} ro={0.32} seg={8} />
            <Cyl rt={0.035} h={0.18} p={[x, 0, -1.695]} c="#c8a64f" m={0.92} ro={0.32} seg={8} />
          </group>
        );
      })}
      {/* service / traceability label, in the gap between the two switches */}
      <Blk s={[0.5, 0.012, 0.26]} p={[0.05, 0.088, -1.5]} c="#d9dcd4" m={0.05} ro={0.85} />
      {Array.from({ length: 7 }).map((_, i) => (
        <Blk key={`b${i}`} s={[0.016 + (i % 3) * 0.01, 0.014, 0.16]} p={[-0.12 + i * 0.056, 0.09, -1.5]} c="#1a1d1a" m={0.05} ro={0.9} />
      ))}
    </Part>
  );
}

function pinsRow(n: number, along: "x" | "z", span: number, off: number, y: number, key: string) {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i - (n - 1) / 2) * (span / n);
    out.push(
      <Blk
        key={`${key}${i}`}
        s={along === "x" ? [span / n / 2.2, 0.025, 0.11] : [0.11, 0.025, span / n / 2.2]}
        p={along === "x" ? [t, y, off] : [off, y, t]}
        c={C.gold}
        m={0.95}
        ro={0.3}
      />,
    );
  }
  return out;
}

function ComponentBody({ f }: { f: Foot }) {
  const t = tex();
  const h = f.h;
  switch (f.kind) {
    case "module": {
      const shieldW = f.w - 0.65;
      const shieldD = f.d - 0.08;
      const shieldX = 0.28;
      return (
        <group>
          {/* Base carrier PCB of the module */}
          <Blk s={[f.w, 0.09, f.d]} p={[0, -h / 2 + 0.045, 0]} c="#0d3524" m={0.2} ro={0.7} />
          {/* Antenna trace keep-out section on the left end */}
          <Blk s={[0.55, 0.015, f.d - 0.12]} p={[-f.w / 2 + 0.32, -h / 2 + 0.095, 0]} c="#082416" m={0.1} ro={0.8} />
          <Blk s={[0.42, 0.018, 0.08]} p={[-f.w / 2 + 0.32, -h / 2 + 0.096, 0.4]} c="#caa24c" m={0.9} ro={0.3} />
          <Blk s={[0.42, 0.018, 0.08]} p={[-f.w / 2 + 0.32, -h / 2 + 0.096, -0.4]} c="#caa24c" m={0.9} ro={0.3} />
          {/* Stamped nickel shield can with dimpled vent notches */}
          <Blk s={[shieldW, h - 0.08, shieldD]} p={[shieldX, 0.04, 0]} rounded={0.02} c="#d2d8da" m={0.95} ro={0.25} />
          <mesh position={[shieldX, h / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[shieldW, shieldD]} />
            <meshStandardMaterial map={t.espShield} roughness={0.3} metalness={0.85} />
          </mesh>
          {/* Castellated pads */}
          {pinsRow(15, "x", f.w * 0.96, -f.d / 2 + 0.03, -h / 2 + 0.02, "a")}
          {pinsRow(15, "x", f.w * 0.96, f.d / 2 - 0.03, -h / 2 + 0.02, "b")}
          {pinsRow(9, "z", f.d * 0.9, -f.w / 2 + 0.03, -h / 2 + 0.02, "c")}
        </group>
      );
    }
    case "qfn": {
      const n = Math.max(3, Math.round((f.pins ?? 16) / 4));
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.008} c={C.ic} m={0.35} ro={0.48} />
          <Cyl rt={0.035} h={h + 0.006} p={[-f.w / 2 + 0.08, 0, -f.d / 2 + 0.08]} c="#3b4043" m={0.3} ro={0.6} seg={10} />
          <Blk s={[f.w * 0.55, 0.025, f.d * 0.55]} p={[0, -h / 2, 0]} c={C.gold} m={0.9} ro={0.35} />
          {/* solder fillets on the perimeter leads */}
          {Array.from({ length: n }).map((_, i) => {
            const t = (i - (n - 1) / 2) * ((f.w * 0.9) / n);
            return (
              <group key={i}>
                <Blk s={[(f.w * 0.9) / n / 2.2, 0.03, 0.07]} p={[t, -h / 2 + 0.012, -f.d / 2 - 0.015]} c="#b8bcbe" m={0.95} ro={0.28} />
                <Blk s={[(f.w * 0.9) / n / 2.2, 0.03, 0.07]} p={[t, -h / 2 + 0.012, f.d / 2 + 0.015]} c="#b8bcbe" m={0.95} ro={0.28} />
                <Blk s={[0.07, 0.03, (f.d * 0.9) / n / 2.2]} p={[-f.w / 2 - 0.015, -h / 2 + 0.012, t * (f.d / f.w)]} c="#b8bcbe" m={0.95} ro={0.28} />
                <Blk s={[0.07, 0.03, (f.d * 0.9) / n / 2.2]} p={[f.w / 2 + 0.015, -h / 2 + 0.012, t * (f.d / f.w)]} c="#b8bcbe" m={0.95} ro={0.28} />
              </group>
            );
          })}
        </group>
      );
    }
    case "soic":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.008} c={C.ic} m={0.35} ro={0.45} />
          {/* Pin-1 dot indicator */}
          <Cyl rt={0.032} h={h + 0.004} p={[-f.w / 2 + 0.08, 0, -f.d / 2 + 0.08]} c="#2b3133" m={0.2} ro={0.8} seg={10} />
          <Blk s={[0.08, 0.02, f.d - 0.06]} p={[-f.w / 2 + 0.04, h / 2, 0]} c="#2b3133" m={0.2} ro={0.8} />
          {pinsRow(4, "x", f.w * 0.9, -f.d / 2 - 0.04, -h / 2 + 0.012, "p")}
          {pinsRow(4, "x", f.w * 0.9, f.d / 2 + 0.04, -h / 2 + 0.012, "q")}
        </group>
      );
    case "sot":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} c={C.ic} m={0.3} ro={0.5} />
          <Cyl rt={0.025} h={h + 0.004} p={[-f.w / 2 + 0.06, 0, -f.d / 2 + 0.06]} c="#2b3133" m={0.2} ro={0.8} seg={8} />
          {pinsRow(Math.ceil((f.pins ?? 5) / 2), "x", f.w * 0.8, -f.d / 2 - 0.035, -h / 2 + 0.01, "p")}
          {pinsRow(Math.floor((f.pins ?? 5) / 2), "x", f.w * 0.55, f.d / 2 + 0.035, -h / 2 + 0.01, "q")}
        </group>
      );
    case "usbc":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.04} c="#b7bec1" m={0.95} ro={0.25} />
          <Blk s={[f.w - 0.16, h - 0.14, 0.12]} p={[0, 0, -f.d / 2 - 0.02]} rounded={0.03} c="#0a0c0d" m={0.3} ro={0.8} />
          <Blk s={[f.w - 0.34, 0.06, 0.1]} p={[0, 0, -f.d / 2 - 0.03]} c="#5f676a" m={0.9} ro={0.4} />
          {/* Internal tongue with gold contact fingers */}
          <Blk s={[0.55, 0.02, 0.28]} p={[0, 0, -f.d / 2 + 0.08]} c="#caa24c" m={0.95} ro={0.25} />
          {/* 4 chassis retention through-hole solder tabs */}
          {[-1, 1].map((sx) =>
            [-1, 1].map((sz) => (
              <Blk
                key={`${sx}${sz}`}
                s={[0.08, 0.18, 0.14]}
                p={[(sx * (f.w + 0.1)) / 2, -h / 2 + 0.04, (sz * f.d * 0.6) / 2]}
                c="#9ea6a8"
                m={0.95}
                ro={0.25}
              />
            )),
          )}
          {/* CC1/CC2 5.1k pull-down resistors right beside the port */}
          <Blk s={[0.08, 0.04, 0.045]} p={[f.w / 2 + 0.14, -h / 2 + 0.02, -0.1]} c="#1b1d1e" m={0.3} ro={0.5} />
          <Blk s={[0.08, 0.04, 0.045]} p={[f.w / 2 + 0.14, -h / 2 + 0.02, 0.1]} c="#1b1d1e" m={0.3} ro={0.5} />
          {/* Board reinforcement bracket */}
          <Blk s={[f.w + 0.2, 0.05, 0.18]} p={[0, -h / 2 + 0.02, f.d / 2 - 0.05]} c="#9aa2a4" m={0.95} ro={0.3} />
        </group>
      );
    case "conn":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.02} c="#1b1f21" m={0.2} ro={0.6} />
          <Blk s={[f.w - 0.08, h - 0.08, 0.06]} p={[f.x > 0 ? f.w / 2 : -f.w / 2, 0, 0]} c="#0a0c0d" m={0.2} ro={0.8} />
          {pinsRow(f.pins ?? 4, "z", f.d * 0.8, 0, -h / 2 + 0.02, "p")}
          <Blk s={[f.w * 0.5, 0.03, f.d + 0.06]} p={[0, -h / 2 + 0.01, 0]} c={C.gold} m={0.9} ro={0.3} />
        </group>
      );
    case "hdr":
      return (
        <group>
          <Blk s={[f.w, 0.08, f.d]} p={[0, -h / 2 + 0.04, 0]} c="#141718" m={0.2} ro={0.7} />
          {Array.from({ length: f.pins ?? 6 }).map((_, i) => (
            <Blk
              key={i}
              s={[0.05, h, 0.05]}
              p={[(i - ((f.pins ?? 6) - 1) / 2) * (f.w / (f.pins ?? 6)), 0.02, 0]}
              c={C.gold}
              m={0.95}
              ro={0.28}
            />
          ))}
        </group>
      );
    case "mic":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.015} c="#8b9295" m={0.9} ro={0.35} />
          <Cyl rt={0.055} h={h + 0.01} p={[0.07, 0.006, 0]} c="#0b0d0e" m={0.2} ro={0.9} seg={14} />
          <Blk s={[f.w + 0.03, 0.02, f.d + 0.03]} p={[0, -h / 2, 0]} c={C.gold} m={0.9} ro={0.35} />
        </group>
      );
    case "sw":
      return (
        <group>
          <Blk s={[f.w, h * 0.55, f.d]} p={[0, -h * 0.2, 0]} rounded={0.02} c="#17191b" m={0.25} ro={0.6} />
          <Blk s={[f.w * 0.94, h * 0.45, f.d * 0.94]} p={[0, h * 0.14, 0]} rounded={0.03} c="#9ea6a8" m={0.92} ro={0.3} />
          <Cyl rt={f.w * 0.17} h={h * 0.5} p={[0, h * 0.42, 0]} c="#2b2f30" m={0.4} ro={0.55} seg={18} />
          {[-1, 1].map((sx) =>
            [-1, 1].map((sz) => (
              <Blk key={`${sx}${sz}`} s={[0.13, 0.03, 0.13]} p={[(sx * f.w) / 2.2, -h / 2 + 0.01, (sz * f.d) / 2.2]} c={C.gold} m={0.95} ro={0.3} />
            )),
          )}
        </group>
      );
    case "xtal":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.01} c="#b9c0c2" m={0.95} ro={0.28} />
          <Blk s={[f.w + 0.02, 0.02, f.d + 0.02]} p={[0, -h / 2, 0]} c={C.gold} m={0.9} ro={0.35} />
        </group>
      );
    case "ind":
      return (
        <group>
          <Blk s={[f.w, h, f.d]} rounded={0.05} c="#26292b" m={0.45} ro={0.62} />
          <Blk s={[f.w * 0.9, 0.03, f.d * 0.9]} p={[0, -h / 2 + 0.01, 0]} c={C.gold} m={0.9} ro={0.35} />
        </group>
      );
    case "led":
    default:
      return <Blk s={[f.w, h, f.d]} c={C.ic} m={0.3} ro={0.5} />;
  }
}

function Passives() {
  return (
    <Part id="passives">
      <group position={[0, -0.18, 0]}>
        {PASSIVES.map((p, i) => {
          const w = p.rot ? p.d : p.w;
          const d = p.rot ? p.w : p.d;
          // Ceramic caps are tan/brown (#af8a62), resistors are matte black (#121415), bulk caps are yellow/orange tantalum (#d99b26) or black molded (#1d2022)
          const col =
            p.kind === "r"
              ? "#131618"
              : p.kind === "fb"
                ? "#252220"
                : p.kind === "cbulk"
                  ? "#202326"
                  : "#b28d68";
          return (
            <group key={i} position={[p.x, 0.16 + p.h / 2, p.z]}>
              <Blk s={[w, p.h, d]} c={col} m={0.25} ro={0.6} />
              {/* Solder termination ends */}
              <Blk s={[w * 0.22, p.h + 0.01, d + 0.008]} p={[-w / 2 + w * 0.11, 0, 0]} c="#c2b48e" m={0.92} ro={0.3} />
              <Blk s={[w * 0.22, p.h + 0.01, d + 0.008]} p={[w / 2 - w * 0.11, 0, 0]} c="#c2b48e" m={0.92} ro={0.3} />
              {/* Tantalum electrolytic cap yellow polarity bar */}
              {p.kind === "cbulk" && (
                <Blk s={[w * 0.16, 0.01, d * 0.85]} p={[-w / 2 + w * 0.28, p.h / 2 + 0.006, 0]} c="#f0b232" m={0.2} ro={0.5} />
              )}
            </group>
          );
        })}
      </group>
    </Part>
  );
}

function Leds() {
  return (
    <Part id="leds">
      <group position={[0, -0.19, 0]}>
        {LED_POS.map((l, i) => (
          <group key={i} position={[l.x, 0.19, l.z]}>
            <Blk s={[0.16, 0.06, 0.1]} c="#d7dbd8" m={0.1} ro={0.4} emissive={l.color} ei={1.4} />
            <Blk s={[0.05, 0.03, 0.12]} p={[-0.09, -0.015, 0]} c={C.gold} m={0.95} ro={0.3} />
            <Blk s={[0.05, 0.03, 0.12]} p={[0.09, -0.015, 0]} c={C.gold} m={0.95} ro={0.3} />
          </group>
        ))}
      </group>
    </Part>
  );
}

function TestPoints() {
  return (
    <Part id="testpoints">
      <group position={[0, -0.17, 0]}>
        {TEST_POINTS.map(([x, z], i) => (
          <group key={i} position={[x, 0.17, z]}>
            <Cyl rt={0.055} h={0.015} c="#dcb968" m={0.95} ro={0.3} seg={12} />
            {i < 2 && (
              <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.06, 0.016, 6, 14]} />
                <meshStandardMaterial color="#c9cfd1" metalness={0.95} roughness={0.3} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </Part>
  );
}

function ShieldCans() {
  const t = tex();
  return (
    <>
      {SHIELD_CANS.map((s) => (
        <Part key={s.id} id={s.id}>
          <Blk s={[s.w, s.h, s.d]} rounded={0.025} c={C.can} m={0.95} ro={0.3} />
          <mesh position={[0, s.h / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[s.w * 0.6, s.d * 0.3]} />
            <meshStandardMaterial map={t.can} transparent metalness={0.8} roughness={0.35} />
          </mesh>
          {/* perforated vent dimples */}
          {[-1, 1].map((sx) => (
            <Cyl key={sx} rt={0.035} h={s.h + 0.01} p={[(sx * s.w) / 3.5, 0, 0]} c="#8f989a" m={0.9} ro={0.35} seg={10} />
          ))}
        </Part>
      ))}
    </>
  );
}

function PcbComponents() {
  return (
    <>
      {FOOTS.map((f) => (
        <Part key={f.id} id={f.id}>
          <ComponentBody f={f} />
        </Part>
      ))}
    </>
  );
}

/* ------------------------------ POWER ------------------------------- */
function Battery() {
  const t = tex();
  return (
    <Part id="battery">
      <RoundedBox args={[5.0, 0.58, 2.7]} radius={0.07} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={C.batt} metalness={0.55} roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0.2925, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 0.55]} />
        <meshStandardMaterial map={t.batt} transparent roughness={0.6} />
      </mesh>
      {/* foil seam */}
      <Blk s={[5.06, 0.06, 2.76]} p={[0, -0.16, 0]} c="#454d58" m={0.5} ro={0.5} />
      {/* protection module */}
      <Blk s={[0.22, 0.34, 1.3]} p={[-2.6, 0.02, -0.3]} rounded={0.02} c="#14401f" m={0.2} ro={0.7} />
      <Blk s={[0.1, 0.1, 0.5]} p={[-2.66, 0.02, -0.3]} c="#1a1d1f" m={0.3} ro={0.5} />
    </Part>
  );
}

function BatteryHarness() {
  const pts: V3[][] = [
    [
      [-2.84, -0.44, -0.4],
      [-3.1, -0.38, -0.2],
      [-3.26, -0.1, 0.05],
      [-3.26, 0.2, 0.22],
      [-3.16, 0.3, 0.3],
    ],
    [
      [-2.84, -0.44, -0.26],
      [-3.06, -0.36, -0.08],
      [-3.18, -0.08, 0.12],
      [-3.18, 0.2, 0.3],
      [-3.1, 0.3, 0.38],
    ],
  ];
  return (
    <Part id="battery-cable">
      {pts.map((p, i) => (
        <TubeMesh key={i} pts={p} radius={0.045} color={i ? "#1a1d1f" : "#7a2b2b"} seg={40} />
      ))}
    </Part>
  );
}

/* ------------------------ CABLES / STRAIN RELIEF -------------------- */
function StrainRelief() {
  return (
    <Part id="strain-relief">
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 4.28, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl rt={0.4} rb={0.44} h={0.3} p={[0, s * 0.3, 0]} c="#1b1e1e" m={0.2} ro={0.85} seg={22} />
          <Cyl rt={0.33} rb={0.37} h={0.26} p={[0, s * 0.06, 0]} c="#1b1e1e" m={0.2} ro={0.85} seg={22} />
          <Cyl rt={0.27} rb={0.31} h={0.24} p={[0, s * -0.16, 0]} c="#1b1e1e" m={0.2} ro={0.85} seg={22} />
          <Cyl rt={0.22} rb={0.26} h={0.22} p={[0, s * -0.36, 0]} c="#1b1e1e" m={0.2} ro={0.85} seg={22} />
        </group>
      ))}
    </Part>
  );
}

function CableIn() {
  const t = tex();
  const j = JACK_WORLD;
  // drapes along the bench, then coils up the standing radio to its side jack
  const pts: V3[] = [
    [-4.35, -0.2, 0],
    [-5.6, -0.35, -0.8],
    [-7.1, -0.5, -1.6],
    [-8.7, -0.35, -1.9],
    [-9.8, 0.6, -1.4],
    [-10.1, 2.6, -0.2],
    [-9.6, 4.6, 1.0],
    [-8.6, 6.4, 1.6],
    [-8.1, 8.0, 1.9],
    [j[0] + 1.0, j[1] - 0.35, j[2] + 0.12],
    [j[0] + 0.42, j[1], j[2] + 0.02],
  ];
  return (
    <Part id="cable-in">
      <TubeMesh pts={pts} radius={0.17} map={t.braid} color="#6a7159" />
      {/* heat-shrink ID band: cyan = radio input */}
      <CableBand pts={pts} t0={0.06} t1={0.1} radius={0.185} color="#1b6f7d" />
      <CableBand pts={pts} t0={0.11} t1={0.125} radius={0.185} color="#dfe6e6" />
      {/* keyed plug landing in the host radio accessory jack */}
      <group position={[j[0] + 0.26, j[1], j[2]]} rotation={[0, RADIO_ROT, 0]}>
        <Blk s={[0.44, 0.62, 1.15]} rounded={0.09} c="#1b1e1e" m={0.3} ro={0.75} />
        <Blk s={[0.2, 0.42, 0.9]} p={[-0.22, 0, 0]} rounded={0.05} c="#0a0c0c" m={0.25} ro={0.85} />
        <Cyl rt={0.11} h={0.24} p={[-0.2, 0, -0.36]} r={[0, 0, Math.PI / 2]} c="#b9913f" m={0.9} ro={0.35} seg={14} />
        <Cyl rt={0.09} h={0.24} p={[-0.2, 0, 0.36]} r={[0, 0, Math.PI / 2]} c="#b9913f" m={0.9} ro={0.35} seg={14} />
        <Cyl rt={0.2} rb={0.14} h={0.5} p={[0.36, 0, 0]} r={[0, 0, Math.PI / 2]} c="#15181a" m={0.2} ro={0.9} seg={16} />
      </group>
    </Part>
  );
}

function CableOut() {
  const t = tex();
  const pts: V3[] = [
    [4.3, -0.2, 0],
    [5.4, -0.1, -0.4],
    [6.6, 0.1, -1.5],
    [7.3, -0.1, -2.9],
    [6.6, -0.5, -3.9],
    [5.2, -0.68, -4.1],
    [4.2, -0.6, -3.4],
  ];
  return (
    <Part id="cable-out">
      <TubeMesh pts={pts} radius={0.17} map={t.braid} color="#6a7159" />
      {/* heat-shrink ID band: amber = accessory output */}
      <CableBand pts={pts} t0={0.06} t1={0.1} radius={0.185} color="#b9711a" />
      <CableBand pts={pts} t0={0.11} t1={0.125} radius={0.185} color="#dfe6e6" />
      <group position={[4.0, -0.58, -3.2]} rotation={[0, 0.5, 0]}>
        <Blk s={[0.55, 0.42, 0.8]} rounded={0.08} c="#1b1e1e" m={0.35} ro={0.7} />
        <Blk s={[0.3, 0.26, 0.16]} p={[0, 0, -0.45]} c="#8d9698" m={0.9} ro={0.35} />
      </group>
    </Part>
  );
}

/* ---------------------------- HOST RADIO ---------------------------- */
/**
 * The radio STANDS UPRIGHT like a real handheld: body vertical, LCD and
 * keypad facing forward, antenna / torch / volume knob on the TOP end,
 * PTT on the left flank, accessory jack on the right flank, battery on
 * the back, resting on its base next to SHIELD-COM.
 *
 * Internally the body is authored face-up (as before) and the whole
 * assembly is tipped up with a +90° X rotation:  (x, y, z) → (x, −z, y)
 */
export const RADIO_POS: V3 = [-11.8, 4.88, 1.6]; // base lands on the ground plane
export const RADIO_ROT = 0.28;
/** accessory jack, in radio-local (face-up) coordinates */
const JACK_LOCAL: V3 = [2.72, 0.95, -4.3];

function radioToWorld(p: V3): V3 {
  // tip upright: local (x, y, z) → (x, −z, y)
  const ux = p[0];
  const uy = -p[2];
  const uz = p[1];
  const c = Math.cos(RADIO_ROT);
  const s = Math.sin(RADIO_ROT);
  return [RADIO_POS[0] + ux * c + uz * s, RADIO_POS[1] + uy, RADIO_POS[2] - ux * s + uz * c];
}
export const JACK_WORLD = radioToWorld(JACK_LOCAL);

const TOP = 1.69; // radio chassis top face (local y)

interface KeyDef {
  main: string;
  sub?: string;
  code: string;
}
const KEYPAD: KeyDef[][] = [
  [
    { main: "MENU", code: "MENU" },
    { main: "▲", code: "UP" },
    { main: "▼", code: "DOWN" },
    { main: "EXIT", code: "EXIT" },
  ],
  [
    { main: "1", sub: "STEP", code: "1" },
    { main: "2", sub: "TXP", code: "2" },
    { main: "3", sub: "SAVE", code: "3" },
    { main: "*", sub: "SCAN", code: "*" },
  ],
  [
    { main: "4", sub: "VOX", code: "4" },
    { main: "5", sub: "W/N", code: "5" },
    { main: "6", sub: "ABR", code: "6" },
    { main: "0", sub: "SQL", code: "0" },
  ],
  [
    { main: "7", sub: "TDR", code: "7" },
    { main: "8", sub: "BEEP", code: "8" },
    { main: "9", sub: "TOT", code: "9" },
    { main: "#", sub: "LOCK", code: "#" },
  ],
];

/** rubber key with a printed legend on top */
function RadioKey({
  p,
  s,
  main,
  sub,
  color = "#1f2325",
  textColor = "#eef2f2",
  subColor = "#95a7a3",
  rounded = 0.07,
  emissive,
  onDown,
  onUp,
}: {
  p: V3;
  s: V3;
  main: string;
  sub?: string;
  color?: string;
  textColor?: string;
  subColor?: string;
  rounded?: number;
  emissive?: string;
  onDown?: () => void;
  onUp?: () => void;
}) {
  const label = makeKeyLabel(main, sub, textColor, subColor);
  return (
    <Pressable p={p} onDown={onDown} onUp={onUp}>
      <RoundedBox args={s} radius={rounded} smoothness={3} castShadow>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.62} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? 0.35 : 0} />
      </RoundedBox>
      <mesh position={[0, s[1] / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[s[0] * 0.92, s[2] * 0.92]} />
        <meshStandardMaterial map={label} transparent roughness={0.6} metalness={0.1} depthWrite={false} />
      </mesh>
    </Pressable>
  );
}

function HostRadio() {
  const dev = useDevice();
  const r = dev.radio;

  /* live LCD */
  const lcd = useMemo(() => new RadioLcd(), []);
  const blink = useRef(false);
  const lastBlink = useRef(0);
  useEffect(() => {
    lcd.draw({ ...r, menuItems: MENU_ITEMS, menuValues: MENU_VALUES }, blink.current);
  }, [lcd, r]);

  const lcdMat = useRef<THREE.MeshStandardMaterial>(null!);
  const lcdLight = useRef<THREE.PointLight>(null!);
  const knob = useRef<THREE.Group>(null!);
  const bulb = useRef<THREE.MeshStandardMaterial>(null!);
  const torchLight = useRef<THREE.PointLight>(null!);
  const stLed = useRef<THREE.MeshStandardMaterial>(null!);
  const stLight = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }, dt) => {
    const d = getDevice().radio;
    const tm = clock.elapsedTime;
    // periodic redraw for blinking segments
    const needsBlink = d.power && (d.scan || d.alarm || d.entry.length > 0);
    if (needsBlink && tm - lastBlink.current > 0.45) {
      lastBlink.current = tm;
      blink.current = !blink.current;
      lcd.draw({ ...d, menuItems: MENU_ITEMS, menuValues: MENU_VALUES }, blink.current);
    }
    const k = 1 - Math.exp(-dt * 8);
    // LCD backlight
    if (lcdMat.current) lcdMat.current.emissiveIntensity += ((d.power ? 1.2 : 0) - lcdMat.current.emissiveIntensity) * k;
    if (lcdLight.current) lcdLight.current.intensity += ((d.power ? 0.55 : 0) - lcdLight.current.intensity) * k;
    // knob: off-detent when powered down, then follows volume
    if (knob.current) {
      const target = d.power ? -0.35 + (d.volume / 10) * 2.6 : -1.15;
      knob.current.rotation.y += (target - knob.current.rotation.y) * k;
    }
    // torch
    if (bulb.current) bulb.current.emissiveIntensity += ((d.torch ? 4 : 0.15) - bulb.current.emissiveIntensity) * k;
    if (torchLight.current) torchLight.current.intensity += ((d.torch ? 9 : 0) - torchLight.current.intensity) * k;
    // TX / RX indicator
    if (stLed.current && stLight.current) {
      let col = "#000000";
      let inten = 0;
      if (d.power && d.ptt) {
        col = "#ff3b2e";
        inten = 1;
      } else if (d.power && d.alarm) {
        col = "#ff3b2e";
        inten = (tm * 5) % 1 < 0.5 ? 1 : 0;
      } else if (d.power && d.monitor) {
        col = "#5cff9d";
        inten = 1;
      } else if (d.power && d.scan) {
        col = "#5cff9d";
        inten = (tm * 2) % 1 < 0.15 ? 1 : 0;
      }
      if (inten > 0) stLed.current.emissive.set(col);
      stLed.current.emissiveIntensity += (inten * 2.2 - stLed.current.emissiveIntensity) * (1 - Math.exp(-dt * 20));
      stLight.current.color.set(col === "#000000" ? "#ffffff" : col);
      stLight.current.intensity += (inten * 0.35 - stLight.current.intensity) * (1 - Math.exp(-dt * 20));
    }
  });

  return (
    <Part id="host-radio">
      <group position={RADIO_POS} rotation={[0, RADIO_ROT, 0]}>
        {/* tip the face-up authoring frame into a standing radio */}
        <group rotation={[Math.PI / 2, 0, 0]}>
        {/* ───────── chassis ───────── */}
        <RoundedBox args={[5.2, 2.7, 11.8]} position={[0, 0.34, 0]} radius={0.38} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#1a1c1e" metalness={0.22} roughness={0.78} />
        </RoundedBox>

        {/* side grip ridges */}
        {Array.from({ length: 9 }).map((_, i) => (
          <group key={`siderib${i}`}>
            <Blk s={[0.12, 0.22, 0.18]} p={[-2.62, 0.1, 0.4 + i * 0.48]} rounded={0.04} c="#111314" m={0.2} ro={0.9} />
            <Blk s={[0.12, 0.22, 0.18]} p={[2.62, 0.1, 0.4 + i * 0.48]} rounded={0.04} c="#111314" m={0.2} ro={0.9} />
          </group>
        ))}

        {/* lanyard loop */}
        <group position={[2.7, 0.5, -4.6]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <torusGeometry args={[0.3, 0.08, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#2d3032" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>

        {/* ───────── LCD ───────── */}
        <Blk s={[4.2, 0.22, 2.3]} p={[0, TOP - 0.07, -3.4]} rounded={0.1} c="#101214" m={0.35} ro={0.65} />
        <mesh position={[0, TOP + 0.05, -3.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.8, 1.95]} />
          <meshStandardMaterial ref={lcdMat} map={lcd.texture} roughness={0.3} metalness={0.2} emissive="#1565c0" emissiveIntensity={1.2} userData={{ noHighlight: true }} />
        </mesh>
        {/* glass gloss */}
        <mesh position={[0, TOP + 0.056, -3.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.8, 1.95]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.06} roughness={0.05} metalness={0.6} depthWrite={false} />
        </mesh>
        <pointLight ref={lcdLight} position={[0, TOP + 0.7, -3.4]} color="#2979ff" intensity={0.55} distance={3.8} decay={2} />

        {/* ───────── speaker + front keys ───────── */}
        <Blk s={[3.2, 0.14, 2.0]} p={[0.35, TOP - 0.03, -1.15]} rounded={0.06} c="#141618" m={0.25} ro={0.85} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Blk key={`grillbar${i}`} s={[2.8, 0.08, 0.16]} p={[0.35, TOP + 0.05, -1.8 + i * 0.26]} rounded={0.04} c="#08090a" m={0.3} ro={0.9} />
        ))}
        <Cyl rt={0.08} h={0.2} p={[-1.6, TOP, -1.1]} c="#08090a" m={0.2} ro={0.9} seg={12} />

        <RadioKey p={[-1.6, TOP + 0.03, -1.8]} s={[0.72, 0.16, 0.46]} main="VFO/MR" color="#e65100" textColor="#ffffff" emissive="#ff6d00" onDown={radioVfoMr} />
        <RadioKey p={[-1.45, TOP + 0.03, 0.15]} s={[0.72, 0.16, 0.46]} main="A/B" color="#00838f" textColor="#ffffff" emissive="#00acc1" onDown={radioAB} />
        <RadioKey p={[2.0, TOP + 0.03, 0.15]} s={[0.64, 0.14, 0.42]} main="BAND" color="#2a2e30" textColor="#c9d2d4" onDown={radioBand} />

        {/* brand plate */}
        <group position={[0.3, TOP + 0.02, 0.15]}>
          <Blk s={[2.3, 0.08, 0.52]} rounded={0.04} c="#bcc4c7" m={0.92} ro={0.26} />
          <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.1, 0.42]} />
            <meshStandardMaterial map={makeKeyLabel("BAOFENG", "", "#121415", "#121415", 40)} transparent roughness={0.4} metalness={0.3} depthWrite={false} />
          </mesh>
        </group>

        {/* ───────── 4 × 4 keypad ───────── */}
        <group position={[0, TOP - 0.07, 2.7]}>
          <Blk s={[4.4, 0.2, 4.2]} rounded={0.08} c="#121415" m={0.3} ro={0.7} />
          {KEYPAD.map((row, ri) =>
            row.map((k, ci) => (
              <RadioKey
                key={k.code}
                p={[-1.5 + ci * 1.0, 0.1 + 0.08, -1.35 + ri * 0.9]}
                s={[0.86, 0.16, 0.72]}
                main={k.main}
                sub={k.sub}
                color={ri === 0 ? "#26292c" : "#1c1f21"}
                onDown={() => radioKey(k.code)}
              />
            )),
          )}
        </group>
        {/* model badge */}
        <group position={[0, TOP + 0.02, 5.2]}>
          <Blk s={[1.5, 0.06, 0.4]} rounded={0.12} c="#0e1011" m={0.4} ro={0.6} />
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.3, 0.32]} />
            <meshStandardMaterial map={makeKeyLabel("UV-82", "", "#eef2f2", "#eef2f2", 40)} transparent roughness={0.5} depthWrite={false} />
          </mesh>
        </group>

        {/*
         * ───────── TOP DECK — the real top end of the standing radio ─────────
         * This group re-orients its children so their +Y points out of the
         * top end of the body: antenna, torch, TX LED and knob all stand UP,
         * exactly like the reference walkie-talkie.
         */}
        <group position={[0, 0.34, -5.86]} rotation={[-Math.PI / 2, 0, 0]}>
          {/* machined top deck plate closing the body end */}
          <Blk s={[4.7, 0.1, 2.3]} p={[0, -0.03, 0]} rounded={0.05} c="#141618" m={0.3} ro={0.75} />

          {/* SMA antenna base + tall whip — TOP LEFT */}
          <group position={[-1.6, 0, 0.15]}>
            <Cyl rt={0.46} rb={0.52} h={0.4} p={[0, 0.2, 0]} c="#c89d38" m={0.95} ro={0.28} seg={22} />
            {Array.from({ length: 12 }).map((_, i) => (
              <Blk key={i} s={[0.06, 0.34, 0.1]} p={[Math.cos((i / 12) * Math.PI * 2) * 0.47, 0.2, Math.sin((i / 12) * Math.PI * 2) * 0.47]} r={[0, -(i / 12) * Math.PI * 2, 0]} c="#a67f28" m={0.95} ro={0.3} />
            ))}
            <Cyl rt={0.36} h={0.3} p={[0, 0.55, 0]} c="#202325" m={0.4} ro={0.6} seg={20} />
            <group position={[0, 0.7, 0]} rotation={[0.03, 0, 0.02]}>
              <Cyl rt={0.28} rb={0.36} h={1.4} p={[0, 0.7, 0]} c="#17191a" m={0.2} ro={0.85} seg={18} />
              <Cyl rt={0.18} rb={0.28} h={4.2} p={[0, 3.5, 0]} c="#17191a" m={0.2} ro={0.88} seg={16} />
              <Cyl rt={0.16} rb={0.18} h={2.2} p={[0, 6.7, 0]} c="#17191a" m={0.2} ro={0.88} seg={16} />
              {Array.from({ length: 4 }).map((_, i) => (
                <Cyl key={`tiprib${i}`} rt={0.18} h={0.08} p={[0, 7.3 + i * 0.16, 0]} c="#232628" m={0.3} ro={0.8} seg={14} />
              ))}
              <Cyl rt={0.16} h={0.2} p={[0, 8.0, 0]} c="#1a1c1d" m={0.3} ro={0.85} seg={14} />
            </group>
          </group>

          {/* torch — TOP CENTRE, click to toggle */}
          <Pressable p={[-0.3, 0, 0.5]} dir={[0, -0.03, 0]} onDown={() => radioToggle("torch")}>
            <Cyl rt={0.3} rb={0.2} h={0.3} p={[0, 0.15, 0]} c="#d0d7da" m={0.95} ro={0.15} seg={20} />
            <mesh position={[0, 0.26, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial ref={bulb} color="#ffffff" emissive="#fff4d6" emissiveIntensity={0.15} roughness={0.1} userData={{ noHighlight: true }} />
            </mesh>
            <pointLight ref={torchLight} position={[0, 0.5, 0]} intensity={0} distance={10} decay={2} color="#fff1d0" />
          </Pressable>

          {/* TX / RX status LED — beside the torch */}
          <group position={[0.55, 0, 0.55]}>
            <Cyl rt={0.13} h={0.08} p={[0, 0.04, 0]} c="#0c0e0f" m={0.4} ro={0.7} seg={16} />
            <mesh position={[0, 0.09, 0]}>
              <sphereGeometry args={[0.085, 14, 14]} />
              <meshStandardMaterial ref={stLed} color="#2a2f31" emissive="#ff3b2e" emissiveIntensity={0} roughness={0.3} userData={{ noHighlight: true }} />
            </mesh>
            <pointLight ref={stLight} position={[0, 0.28, 0]} intensity={0} distance={2.2} decay={2} />
          </group>

          {/* faceted volume / power knob — TOP RIGHT, click to toggle power */}
          <Pressable p={[1.62, 0, 0.15]} dir={[0, -0.04, 0]} onDown={radioPower}>
            <Cyl rt={0.62} rb={0.68} h={0.26} p={[0, 0.13, 0]} c="#111314" m={0.4} ro={0.6} seg={24} />
            <group ref={knob}>
              <Cyl rt={0.56} h={0.58} p={[0, 0.55, 0]} c="#1e2124" m={0.45} ro={0.55} seg={8} />
              {Array.from({ length: 8 }).map((_, i) => (
                <Blk key={i} s={[0.05, 0.48, 0.18]} p={[Math.cos(((i + 0.5) / 8) * Math.PI * 2) * 0.53, 0.55, Math.sin(((i + 0.5) / 8) * Math.PI * 2) * 0.53]} r={[0, -((i + 0.5) / 8) * Math.PI * 2, 0]} c="#2b3033" m={0.5} ro={0.5} />
              ))}
              <Cyl rt={0.48} h={0.1} p={[0, 0.89, 0]} c="#b8c2c5" m={0.9} ro={0.25} seg={24} />
              <Cyl rt={0.4} h={0.12} p={[0, 0.96, 0]} c="#141618" m={0.3} ro={0.7} seg={24} />
              <Blk s={[0.07, 0.02, 0.32]} p={[0, 1.025, -0.18]} c="#ffffff" m={0.2} ro={0.5} />
            </group>
            {/* OFF / VOL scale etched on the deck */}
            {Array.from({ length: 7 }).map((_, i) => {
              const a = -0.35 + (i / 6) * 2.6;
              return <Blk key={i} s={[0.03, 0.02, 0.1]} p={[Math.sin(a) * 0.78, 0.04, -Math.cos(a) * 0.78]} r={[0, -a, 0]} c="#9aa3a6" m={0.3} ro={0.6} />;
            })}
          </Pressable>
        </group>

        {/* ───────── left side: PTT rocker · CALL · MONI ───────── */}
        <Blk s={[0.3, 0.9, 2.4]} p={[-2.62, 0.4, -2.4]} rounded={0.1} c="#15181a" m={0.35} ro={0.65} />
        <Pressable p={[-2.7, 0.44, -2.92]} dir={[0.08, 0, 0]} onDown={() => radioHold("ptt", true)} onUp={() => radioHold("ptt", false)}>
          <Blk s={[0.36, 0.82, 0.95]} rounded={0.08} c="#25292c" m={0.4} ro={0.55} />
          {[-0.3, -0.1, 0.1, 0.3].map((z) => (
            <Blk key={z} s={[0.38, 0.05, 0.08]} p={[0, 0.2, z]} c="#111416" m={0.3} ro={0.8} />
          ))}
          <mesh position={[-0.19, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial map={makeKeyLabel("PTT", "A", "#dfe6e8", "#95a7a3", 40)} transparent roughness={0.6} depthWrite={false} />
          </mesh>
        </Pressable>
        <Pressable p={[-2.7, 0.44, -1.88]} dir={[0.08, 0, 0]} onDown={() => radioHold("ptt", true)} onUp={() => radioHold("ptt", false)}>
          <Blk s={[0.36, 0.82, 0.95]} rounded={0.08} c="#25292c" m={0.4} ro={0.55} />
          {[-0.3, -0.1, 0.1, 0.3].map((z) => (
            <Blk key={z} s={[0.38, 0.05, 0.08]} p={[0, -0.2, z]} c="#111416" m={0.3} ro={0.8} />
          ))}
          <mesh position={[-0.19, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial map={makeKeyLabel("PTT", "B", "#dfe6e8", "#95a7a3", 40)} transparent roughness={0.6} depthWrite={false} />
          </mesh>
        </Pressable>
        <Pressable p={[-2.7, 0.4, -0.6]} dir={[0.06, 0, 0]} onDown={() => radioToggle("alarm")}>
          <Blk s={[0.26, 0.42, 0.55]} rounded={0.08} c="#e65100" m={0.35} ro={0.5} emissive="#ff6d00" ei={0.3} />
          <mesh position={[-0.14, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.5, 0.36]} />
            <meshStandardMaterial map={makeKeyLabel("CALL", "", "#ffffff", "#ffffff", 40)} transparent roughness={0.6} depthWrite={false} />
          </mesh>
        </Pressable>
        <Pressable p={[-2.7, 0.4, 0.2]} dir={[0.06, 0, 0]} onDown={() => radioHold("monitor", true)} onUp={() => radioHold("monitor", false)}>
          <Blk s={[0.26, 0.42, 0.55]} rounded={0.08} c="#2a2e30" m={0.3} ro={0.6} />
          <mesh position={[-0.14, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.5, 0.36]} />
            <meshStandardMaterial map={makeKeyLabel("MONI", "", "#c9d2d4", "#c9d2d4", 40)} transparent roughness={0.6} depthWrite={false} />
          </mesh>
        </Pressable>

        {/* ───────── right side: 2-pin accessory jack (SHIELD-COM link) ───────── */}
        <group position={JACK_LOCAL}>
          <Blk s={[0.38, 1.1, 1.8]} rounded={0.08} c="#101213" m={0.4} ro={0.65} />
          <group position={[0.25, 0.1, -1.0]} rotation={[0, -0.4, 0]}>
            <Blk s={[0.15, 0.85, 0.7]} rounded={0.05} c="#141718" m={0.15} ro={0.9} />
          </group>
          <Cyl rt={0.17} h={0.2} p={[0.2, 0.0, -0.36]} r={[0, 0, Math.PI / 2]} c="#7d8674" m={0.85} ro={0.4} seg={16} />
          <Cyl rt={0.13} h={0.2} p={[0.2, 0.0, 0.36]} r={[0, 0, Math.PI / 2]} c="#7d8674" m={0.85} ro={0.4} seg={16} />
          <mesh position={[0.2, 0.62, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.2, 0.26]} />
            <meshStandardMaterial map={makeKeyLabel("SP · MIC", "", "#8f999c", "#8f999c", 36)} transparent roughness={0.6} depthWrite={false} />
          </mesh>
        </group>

        {/* ───────── rear: battery pack + belt clip ───────── */}
        <group position={[0, -0.92, 1.6]}>
          <RoundedBox args={[5.0, 0.85, 7.8]} radius={0.2} smoothness={3} castShadow>
            <meshStandardMaterial color="#17191b" metalness={0.25} roughness={0.82} />
          </RoundedBox>
          {Array.from({ length: 6 }).map((_, i) => (
            <Blk key={`battrib${i}`} s={[0.12, 0.9, 6.2]} p={[-1.75 + i * 0.7, 0, 0]} c="#0f1112" m={0.2} ro={0.9} />
          ))}
          <group position={[0, 0.2, -4.1]}>
            <Blk s={[1.6, 0.35, 0.55]} rounded={0.06} c="#2c3033" m={0.4} ro={0.6} />
            <Blk s={[1.2, 0.08, 0.16]} p={[0, 0.18, 0]} c="#b8c0c2" m={0.85} ro={0.3} />
          </group>
        </group>
        <group position={[0, -1.5, 1.2]}>
          <Blk s={[1.8, 0.18, 3.8]} rounded={0.1} c="#1e2225" m={0.7} ro={0.45} />
          <Blk s={[1.5, 0.3, 0.8]} p={[0, -0.16, 2.0]} rounded={0.06} c="#151719" m={0.7} ro={0.5} />
          <Cyl rt={0.14} h={0.12} p={[-0.5, 0.1, -1.4]} c="#8a9496" m={0.9} ro={0.3} seg={12} />
          <Cyl rt={0.14} h={0.12} p={[0.5, 0.1, -1.4]} c="#8a9496" m={0.9} ro={0.3} seg={12} />
        </group>
        </group>
      </group>
    </Part>
  );
}

/* ---------------------------- DIMENSIONS ---------------------------- */
function Dim({ a, b, label, off = [0, 0, 0] as V3 }: { a: V3; b: V3; label: string; off?: V3 }) {
  const A: V3 = [a[0] + off[0], a[1] + off[1], a[2] + off[2]];
  const B: V3 = [b[0] + off[0], b[1] + off[1], b[2] + off[2]];
  const mid: V3 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
  return (
    <group>
      <Line points={[A, B]} color="#f0a93b" lineWidth={1} transparent opacity={0.8} />
      <Line points={[a, A]} color="#f0a93b" lineWidth={0.7} transparent opacity={0.35} dashed dashSize={0.1} gapSize={0.1} />
      <Line points={[b, B]} color="#f0a93b" lineWidth={0.7} transparent opacity={0.35} dashed dashSize={0.1} gapSize={0.1} />
      <Html position={mid} center distanceFactor={12} zIndexRange={[15, 0]}>
        <div className="dim-chip">{label}</div>
      </Html>
    </group>
  );
}

function Dimensions() {
  const st = useViewer();
  if (!st.dims) return null;
  return (
    <group>
      <Dim a={[-3.9, -1.0, 2.2]} b={[3.9, -1.0, 2.2]} off={[0, 0, 1.0]} label="78.0 mm" />
      <Dim a={[3.9, -1.0, -2.2]} b={[3.9, -1.0, 2.2]} off={[1.1, 0, 0]} label="44.0 mm" />
      <Dim a={[-3.9, -1.0, -2.2]} b={[-3.9, 0.92, -2.2]} off={[-1.0, 0, -0.5]} label="19.2 mm" />
      <Dim a={[-3.3, 0.16, 1.7]} b={[3.3, 0.16, 1.7]} off={[0, 1.9, 0.4]} label="PCB 66.0 mm" />
    </group>
  );
}

/* --------------------------- ASSEMBLY AXIS --------------------------- */
function AssemblyAxis() {
  const st = useViewer();
  const g = useRef<THREE.Group>(null!);
  const o = useRef(0);
  useFrame((_, dt) => {
    const target = st.mode === "exploded" ? 1 : 0;
    o.current += (target - o.current) * (1 - Math.exp(-dt * 5));
    if (g.current) {
      g.current.visible = o.current > 0.02;
      g.current.scale.setScalar(1);
      g.current.traverse((m) => {
        const mat = (m as THREE.Mesh).material as THREE.Material | undefined;
        if (mat) {
          mat.transparent = true;
          mat.opacity = o.current * 0.5;
        }
      });
    }
  });
  const rungs = [-3.2, -1.95, -1.35, -0.75, 0.9, 1.9, 2.9, 3.9, 4.9, 5.6, 6.3, 7.1];
  return (
    <group ref={g}>
      <Line points={[[0, -4.4, 0] as V3, [0, 8.4, 0] as V3]} color="#4fd1e0" lineWidth={1} dashed dashSize={0.16} gapSize={0.14} transparent opacity={0.5} />
      {rungs.map((y, i) => (
        <Line
          key={i}
          points={[
            [-4.3, y, 0] as V3,
            [4.3, y, 0] as V3,
          ]}
          color={i < 4 ? "#f0a93b" : "#4fd1e0"}
          lineWidth={0.6}
          dashed
          dashSize={0.1}
          gapSize={0.34}
          transparent
          opacity={0.28}
        />
      ))}
    </group>
  );
}

/* ------------------------------ SCENE ------------------------------- */
export function ShieldComModel() {
  return (
    <group>
      <AssemblyAxis />
      <LowerEnclosure />
      <Gasket />
      <Frame />
      <Standoffs />
      <Pcb />
      <PcbComponents />
      <Passives />
      <Leds />
      <TestPoints />
      <ShieldCans />
      <Insulator />
      <Battery />
      <BatteryHarness />
      <UpperEnclosure />
      <ControlGuards />
      <SosControl />
      <MarkControl />
      <LedPipes />
      <AcousticInlets />
      <Fasteners />
      <StrainRelief />
      <UsbPlug />
      <CableIn />
      <CableOut />
      <HostRadio />
      <Dimensions />
    </group>
  );
}

/** world-space focus point for a part (used by the camera rig) */
export function partFocus(id: string): THREE.Vector3 {
  const p = PARTS_BY_ID[id];
  if (!p) return new THREE.Vector3(0, 0, 0);
  return new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]);
}

export const LABEL_ORDER = PARTS.slice().sort((a, b) => (b.labelPriority ?? 0) - (a.labelPriority ?? 0));
