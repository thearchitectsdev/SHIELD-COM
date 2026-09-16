import * as THREE from 'three'
/* ------------------------------------------------------------------ */
/*  FREE-MOVE drag controller                                          */
/* ------------------------------------------------------------------ */
/*  A tiny module-level singleton so that every part mesh (rendered by
    <P> in viewer.tsx) can hand a pointer-down straight to the gizmo
    without threading callbacks through the whole model tree.            */

export type DragMode = 'screen' | 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz'

type BeginFn = (ev: PointerEvent, id: string, mode: DragMode) => void

export const DragCtl: {
  begin: BeginFn | null
  dragging: boolean
  clickGuardAt: number
  /* overlay hit-volumes of the gizmo — they win over model geometry */
  gizmoObjects: THREE.Object3D[]
} = {
  begin: null,
  dragging: false,
  clickGuardAt: 0,
  gizmoObjects: [],
}

const gizmoRay = new THREE.Raycaster()

/* true when the pointer is aimed at a gizmo handle, even if a part of the
   model sits closer to the camera — the gizmo is an overlay, it must win. */
export function hitGizmo(ray: THREE.Ray, camera: THREE.Camera): boolean {
  gizmoRay.ray.copy(ray)
  gizmoRay.camera = camera as THREE.PerspectiveCamera
  gizmoRay.near = 0
  gizmoRay.far = Infinity
  return gizmoRay.intersectObjects(DragCtl.gizmoObjects, false).length > 0
}

export function armClickGuard() {
  DragCtl.clickGuardAt = performance.now()
}

/* true when the click should be swallowed (it ends a drag) */
export function consumeClick(): boolean {
  if (DragCtl.clickGuardAt && performance.now() - DragCtl.clickGuardAt < 900) {
    DragCtl.clickGuardAt = 0
    return true
  }
  return false
}

/* closest parameter along an infinite axis line to a pointer ray */
export function axisParam(ray: THREE.Ray, origin: THREE.Vector3, dir: THREE.Vector3): number | null {
  const w0 = new THREE.Vector3().subVectors(origin, ray.origin)
  const a = dir.dot(dir)
  const b = dir.dot(ray.direction)
  const c = ray.direction.dot(ray.direction)
  const d = dir.dot(w0)
  const e = ray.direction.dot(w0)
  const denom = a * c - b * b
  if (Math.abs(denom) < 1e-6) return null
  return (b * e - c * d) / denom
}

/* direction-only world → parent-local conversion (rotation + scale safe) */
export function parentInverse(obj: THREE.Object3D): THREE.Matrix4 {
  const m = new THREE.Matrix4()
  if (obj.parent) {
    m.copy(obj.parent.matrixWorld)
    m.setPosition(0, 0, 0)
    m.invert()
  }
  return m
}

