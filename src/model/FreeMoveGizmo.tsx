import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useViewer, PART_OBJECTS, descendantsOf, resolveOffset } from '../lib/viewer'
import { PARTS } from '../lib/parts'
import { DragCtl, armClickGuard, axisParam, parentInverse, type DragMode } from '../lib/dragmove'

/* ------------------------------------------------------------------ */
/*  FREE MOVE                                                          */
/* ------------------------------------------------------------------ */
/*  Three ways to move a part, all of them forgiving:
      1. grab the part ITSELF and drag  → slides in the screen plane
      2. grab the centre hub            → same screen-plane slide
      3. grab an axis arrow / plane pad → constrained to that axis/plane
    Handles are drawn on top of the model (depthTest off) and scale with
    camera distance, so they are always big enough to hit.               */

const AXIS_VEC: Record<'x' | 'y' | 'z', THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}
const PLANE_AXIS: Record<'xy' | 'xz' | 'yz', 'z' | 'y' | 'x'> = { xy: 'z', xz: 'y', yz: 'x' }
const AXIS_COLOR: Record<'x' | 'y' | 'z', string> = { x: '#ff6b6b', y: '#5ef08a', z: '#5aa9ff' }
const PLANE_COLOR: Record<'xy' | 'xz' | 'yz', string> = { xy: '#ffd24a', yz: '#4ae5ff', xz: '#ff6bf0' }

type Target = { obj: THREE.Object3D; base: THREE.Vector3; inv: THREE.Matrix4 }

type DragState = {
  id: string
  mode: DragMode
  targets: Target[]
  selfInv: THREE.Matrix4
  startOffset: [number, number, number]
  startWorld: THREE.Vector3
  axis: THREE.Vector3 | null
  normal: THREE.Vector3 | null
  t0: number
  hit0: THREE.Vector3
  lastRaw: THREE.Vector3
  accum: THREE.Vector3
  applied: THREE.Vector3
  moved: boolean
}

const round3 = (v: number) => Math.round(v * 100) / 100

export function FreeMoveGizmo() {
  const { selected, freeMove, partOffsets, setPartOffsetAbs, resetPartOffset, resetPartOffsets } = useViewer()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null

  const anchorRef = useRef<THREE.Group>(null)
  const drag = useRef<DragState | null>(null)
  /* every invisible grab volume is registered so model geometry can never
     steal a pointer that is aimed at the gizmo */
  const grabRefs = useRef<THREE.Object3D[]>([])
  const grab = (i: number) => (o: THREE.Object3D | null) => {
    if (o) grabRefs.current[i] = o
  }
  useEffect(() => {
    DragCtl.gizmoObjects = grabRefs.current.filter(Boolean)
    return () => {
      DragCtl.gizmoObjects = []
    }
  })
  const [hover, setHover] = useState<DragMode | null>(null)
  const readout = useRef<HTMLSpanElement | null>(null)
  const offsetsRef = useRef(partOffsets)
  offsetsRef.current = partOffsets

  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const plane = useMemo(() => new THREE.Plane(), [])
  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      v2: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
    }),
    [],
  )

  const rayFrom = useCallback(
    (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      return raycaster.ray
    },
    [camera, gl, ndc, raycaster],
  )

  /* every mesh of this part + every part bolted to it */
  const collectTargets = useCallback((id: string): Target[] => {
    const ids = [id, ...descendantsOf(id)]
    const out: Target[] = []
    for (const pid of ids) {
      const set = PART_OBJECTS.get(pid)
      if (!set) continue
      set.forEach((obj) => out.push({ obj, base: obj.position.clone(), inv: parentInverse(obj) }))
    }
    return out
  }, [])

  const applyWorldDelta = useCallback((st: DragState, world: THREE.Vector3) => {
    st.applied.copy(world)
    for (const t of st.targets) {
      tmp.v.copy(world).applyMatrix4(t.inv)
      t.obj.position.set(t.base.x + tmp.v.x, t.base.y + tmp.v.y, t.base.z + tmp.v.z)
    }
    if (readout.current) {
      const own = tmp.v2.copy(world).applyMatrix4(st.selfInv).add(new THREE.Vector3(...st.startOffset))
      readout.current.textContent = `X ${round3(own.x).toFixed(2)}   Y ${round3(own.y).toFixed(2)}   Z ${round3(own.z).toFixed(2)}`
    }
  }, [])

  const beginDrag = useCallback(
    (ev: PointerEvent, id: string, mode: DragMode) => {
      if (id === 'host-radio') return
      const set = PART_OBJECTS.get(id)
      if (!set || set.size === 0) return

      /* live world centre of the part (follows explode + flip + earlier moves) */
      const centre = new THREE.Vector3()
      const p = new THREE.Vector3()
      set.forEach((o) => {
        o.getWorldPosition(p)
        centre.add(p)
      })
      centre.divideScalar(set.size)

      const targets = collectTargets(id)
      const firstOwn = targets.find((t) => t.obj.parent === set.values().next().value?.parent)
      const selfInv = firstOwn ? firstOwn.inv : (parentInverse(set.values().next().value as THREE.Object3D))

      const st: DragState = {
        id,
        mode,
        targets,
        selfInv,
        startOffset: (offsetsRef.current[id] ?? [0, 0, 0]) as [number, number, number],
        startWorld: centre.clone(),
        axis: null,
        normal: null,
        t0: 0,
        hit0: new THREE.Vector3(),
        lastRaw: new THREE.Vector3(),
        accum: new THREE.Vector3(),
        applied: new THREE.Vector3(),
        moved: false,
      }

      const ray = rayFrom(ev)
      if (mode === 'x' || mode === 'y' || mode === 'z') {
        st.axis = AXIS_VEC[mode]
        const t = axisParam(ray, centre, st.axis)
        if (t === null) return
        st.t0 = t
      } else {
        st.normal =
          mode === 'screen'
            ? camera.getWorldDirection(new THREE.Vector3()).negate()
            : AXIS_VEC[PLANE_AXIS[mode]].clone()
        const hit = new THREE.Vector3()
        if (!ray.intersectPlane(plane.setFromNormalAndCoplanarPoint(st.normal, centre), hit)) return
        st.hit0.copy(hit)
      }

      drag.current = st
      DragCtl.dragging = true
      armClickGuard()
      if (controls) controls.enabled = false
      document.body.style.cursor = 'grabbing'
      gl.domElement.style.cursor = 'grabbing'
    },
    [camera, collectTargets, controls, gl, plane, rayFrom],
  )

  /* expose "grab any part" to <P> */
  useEffect(() => {
    if (!freeMove) {
      DragCtl.begin = null
      return
    }
    DragCtl.begin = beginDrag
    return () => {
      DragCtl.begin = null
    }
  }, [freeMove, beginDrag])

  /* -------------------------------------------------------------- */
  /*  drag / release                                                 */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!freeMove) return

    const onMove = (ev: PointerEvent) => {
      const st = drag.current
      if (!st) return
      const ray = rayFrom(ev)
      const raw = new THREE.Vector3()

      if (st.axis) {
        const t = axisParam(ray, st.startWorld, st.axis)
        if (t === null) return
        raw.copy(st.axis).multiplyScalar(t - st.t0)
      } else if (st.normal) {
        const hit = new THREE.Vector3()
        if (!ray.intersectPlane(plane.setFromNormalAndCoplanarPoint(st.normal, st.startWorld), hit)) return
        raw.copy(hit).sub(st.hit0)
      } else return

      /* incremental so Shift (precision) can be toggled mid-drag */
      const step = raw.clone().sub(st.lastRaw)
      st.lastRaw.copy(raw)
      if (ev.shiftKey) step.multiplyScalar(0.2)
      st.accum.add(step)

      let world = st.accum
      if (ev.altKey) {
        const g = 0.1
        world = new THREE.Vector3(
          Math.round(st.accum.x / g) * g,
          Math.round(st.accum.y / g) * g,
          Math.round(st.accum.z / g) * g,
        )
      }
      if (world.length() > 0.0015) st.moved = true
      applyWorldDelta(st, world)
    }

    const onUp = () => {
      const st = drag.current
      if (!st) return
      drag.current = null
      DragCtl.dragging = false
      if (controls) controls.enabled = true
      document.body.style.cursor = 'auto'
      gl.domElement.style.cursor = ''
      /* commit once — the whole assembly re-renders with the new offset */
      const own = tmp.v.copy(st.applied).applyMatrix4(st.selfInv)
      setPartOffsetAbs(st.id, [
        st.startOffset[0] + own.x,
        st.startOffset[1] + own.y,
        st.startOffset[2] + own.z,
      ])
      if (st.moved) armClickGuard()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [applyWorldDelta, controls, freeMove, gl, plane, rayFrom, setPartOffsetAbs, tmp])

  /* release cleanly if the mode is switched off mid-drag */
  useEffect(() => {
    if (freeMove) return
    if (drag.current) {
      drag.current = null
      DragCtl.dragging = false
      if (controls) controls.enabled = true
      document.body.style.cursor = 'auto'
    }
  }, [freeMove, controls])

  /* -------------------------------------------------------------- */
  /*  keyboard nudge — arrows slide in the screen plane, R resets     */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!freeMove || !selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const set = PART_OBJECTS.get(selected)
      if (!set) return
      const k = e.key.toLowerCase()
      const step = e.shiftKey ? 0.02 : 0.12
      const right = tmp.v.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
      const up = tmp.v2.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
      let d: THREE.Vector3 | null = null
      if (k === 'arrowleft') d = right.clone().negate()
      else if (k === 'arrowright') d = right.clone()
      else if (k === 'arrowup') d = up.clone()
      else if (k === 'arrowdown') d = up.clone().negate()
      else if (k === 'pageup') d = AXIS_VEC.y.clone()
      else if (k === 'pagedown') d = AXIS_VEC.y.clone().negate()
      else if (k === 'backspace' || (k === 'delete' && e.shiftKey)) {
        e.preventDefault()
        resetPartOffset(selected)
        return
      } else return
      e.preventDefault()
      const cur = resolveOffset(selected, offsetsRef.current)
      const own = offsetsRef.current[selected] ?? [0, 0, 0]
      const inv = parentInverse(set.values().next().value as THREE.Object3D)
      const local = d.multiplyScalar(step).applyMatrix4(inv)
      setPartOffsetAbs(selected, [
        own[0] + local.x,
        own[1] + local.y,
        own[2] + local.z,
      ])
      void cur
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [camera, freeMove, resetPartOffset, selected, setPartOffsetAbs, tmp])

  /* -------------------------------------------------------------- */
  /*  follow the part: world centroid, world-aligned, screen-scaled   */
  /* -------------------------------------------------------------- */
  useFrame(() => {
    const g = anchorRef.current
    if (!g) return
    if (!freeMove || !selected) {
      g.visible = false
      return
    }
    const set = PART_OBJECTS.get(selected)
    if (!set || set.size === 0) {
      g.visible = false
      return
    }
    g.visible = true

    const centre = tmp.v.set(0, 0, 0)
    set.forEach((o) => {
      o.getWorldPosition(tmp.v2)
      centre.add(tmp.v2)
    })
    centre.divideScalar(set.size)

    const dist = camera.position.distanceTo(centre)
    const parent = g.parent
    if (parent) {
      parent.worldToLocal(centre)
      parent.getWorldQuaternion(tmp.q)
      g.quaternion.copy(tmp.q).invert()
    }
    g.position.copy(centre)
    g.scale.setScalar(THREE.MathUtils.clamp(dist * 0.09, 0.3, 2.4))

    /* keep the XYZ readout live (keyboard nudges / resets don't go through drag) */
    if (readout.current && !drag.current) {
      const o = resolveOffset(selected, offsetsRef.current)
      const txt = `X ${o[0].toFixed(2)}   Y ${o[1].toFixed(2)}   Z ${o[2].toFixed(2)}`
      if (readout.current.textContent !== txt) readout.current.textContent = txt
    }
  })

  /* -------------------------------------------------------------- */
  /*  handles                                                        */
  /* -------------------------------------------------------------- */
  const info = selected ? PARTS[selected] : null
  const carried = selected ? descendantsOf(selected).length : 0
  const start = useCallback(
    (mode: DragMode) => (e: { nativeEvent: unknown; stopPropagation: () => void }) => {
      e.stopPropagation()
      if (DragCtl.dragging) return
      armClickGuard()
      if (selected) beginDrag(e.nativeEvent as PointerEvent, selected, mode)
    },
    [beginDrag, selected],
  )

  const hoverProps = useCallback(
    (mode: DragMode) => ({
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation()
        if (DragCtl.dragging) return
        setHover(mode)
        document.body.style.cursor = mode === 'screen' ? 'grab' : 'move'
      },
      onPointerOut: (e: { stopPropagation: () => void }) => {
        e.stopPropagation()
        if (DragCtl.dragging) return
        setHover(null)
        document.body.style.cursor = 'auto'
      },
    }),
    [],
  )

  const axisHandle = (axis: 'x' | 'y' | 'z') => {
    const on = hover === axis
    const col = on ? '#ffffff' : AXIS_COLOR[axis]
    const rot: [number, number, number] =
      axis === 'x' ? [0, 0, -Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
    const dir = AXIS_VEC[axis]
    return (
      <group key={axis}>
        {/* fat invisible grab tube — the part that actually makes this easy */}
        <mesh
          name={`gizmo-${axis}`}
          ref={grab(1 + (axis === 'x' ? 0 : axis === 'y' ? 1 : 2))}
          position={[dir.x * 0.62, dir.y * 0.62, dir.z * 0.62]}
          rotation={rot}
          onPointerDown={start(axis)}
          {...hoverProps(axis)}
        >
          <cylinderGeometry args={[0.17, 0.17, 1.35, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[dir.x * 0.55, dir.y * 0.55, dir.z * 0.55]} rotation={rot} raycast={() => null}>
          <cylinderGeometry args={[on ? 0.05 : 0.035, on ? 0.05 : 0.035, 1.1, 10]} />
          <meshBasicMaterial color={col} depthTest={false} transparent />
        </mesh>
        <mesh position={[dir.x * 1.16, dir.y * 1.16, dir.z * 1.16]} rotation={rot} raycast={() => null}>
          <coneGeometry args={[on ? 0.14 : 0.11, 0.3, 14]} />
          <meshBasicMaterial color={col} depthTest={false} transparent />
        </mesh>
        <mesh position={[dir.x * 1.36, dir.y * 1.36, dir.z * 1.36]} raycast={() => null}>
          <sphereGeometry args={[on ? 0.1 : 0.075, 14, 14]} />
          <meshBasicMaterial color={col} depthTest={false} transparent />
        </mesh>
      </group>
    )
  }

  const planeHandle = (mode: 'xy' | 'xz' | 'yz') => {
    const on = hover === mode
    const normal = PLANE_AXIS[mode]
    const a = normal === 'x' ? 'y' : 'x'
    const b = normal === 'z' ? 'y' : 'z'
    const u = AXIS_VEC[a]
    const v = AXIS_VEC[b]
    const pos: [number, number, number] = [u.x * 0.46 + v.x * 0.46, u.y * 0.46 + v.y * 0.46, u.z * 0.46 + v.z * 0.46]
    const rot: [number, number, number] =
      normal === 'z' ? [0, 0, 0] : normal === 'y' ? [-Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0]
    return (
      <group key={mode}>
        <mesh
          name={`gizmo-plane-${mode}`}
          ref={grab(4 + (mode === 'xy' ? 0 : mode === 'yz' ? 1 : 2))}
          position={pos}
          rotation={rot}
          onPointerDown={start(mode)}
          {...hoverProps(mode)}
        >
          <boxGeometry args={[0.52, 0.52, 0.02]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={pos} rotation={rot} raycast={() => null}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial
            color={on ? '#ffffff' : PLANE_COLOR[mode]}
            transparent
            opacity={on ? 0.95 : 0.7}
            depthTest={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    )
  }

  if (!freeMove || !selected || selected === 'host-radio') return null

  const movedIds = Object.keys(partOffsets)
  const allMoved = movedIds.length > 0

  return (
    <group ref={anchorRef} renderOrder={999}>
      {/* centre hub — drag it (or the part itself) to slide in the screen plane */}
      <mesh name="gizmo-hub" ref={grab(0)} onPointerDown={start('screen')} {...hoverProps('screen')}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.085, 18, 18]} />
        <meshBasicMaterial color={hover === 'screen' ? '#ffffff' : '#e6f6ff'} depthTest={false} transparent />
      </mesh>
      <mesh raycast={() => null} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.17, 0.2, 32]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.85} depthTest={false} side={THREE.DoubleSide} />
      </mesh>

      {(['x', 'y', 'z'] as const).map(axisHandle)}
      {(['xy', 'yz', 'xz'] as const).map(planeHandle)}

      <Html position={[0, 1.85, 0]} center zIndexRange={[25, 10]}>
        <div className="pointer-events-auto flex flex-col items-center gap-1 select-none">
          <div className="mono whitespace-nowrap rounded border border-sky-400 bg-slate-950/90 px-2 py-1 text-[10px] leading-tight text-sky-300 shadow-xl backdrop-blur">
            <div className="font-bold tracking-wider text-sky-200">{info?.name ?? selected}</div>
            <span ref={readout} className="text-sky-400">
              X 0.00 Y 0.00 Z 0.00
            </span>
            {carried > 0 && (
              <div className="text-[9px] text-emerald-300">+ {carried} attached part{carried > 1 ? 's' : ''} move with it</div>
            )}
          </div>
          <div className="mono whitespace-nowrap rounded bg-slate-950/80 px-2 py-0.5 text-[9px] text-slate-400">
            DRAG PART · ARROWS · SHIFT = FINE · ALT = SNAP
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              resetPartOffset(selected)
            }}
            className="mono rounded border border-amber-500/60 bg-amber-950/80 px-2 py-0.5 text-[9px] text-amber-200 transition-colors hover:bg-amber-900"
          >
            RESET THIS PART
          </button>
          {allMoved && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                resetPartOffsets()
              }}
              className="mono rounded border border-red-500/60 bg-red-950/80 px-2 py-0.5 text-[9px] text-red-200 transition-colors hover:bg-red-900"
            >
              SNAP ALL BACK ({movedIds.length})
            </button>
          )}
        </div>
      </Html>
    </group>
  )
}
