/* ------------------------------------------------------------------ */
/*  Vertical lift mapping for PCB component explosion                  */
/* ------------------------------------------------------------------ */
/* lift heights echo the real stack-up: 0.5 mm passives → 0.9 mm QFNs
   → 1.75 mm SOIC → 3.1 mm WROOM-1 → 5.4 mm shield-can top */
export const LIFT_MAP: Record<string, number> = {
  esp32: 1.0,
  'esp32-shield': 1.55,
  'audio-adc': 0.55,
  'audio-dac': 0.5,
  'analog-filter': 0.38,
  'power-mgmt': 0.6,
  'buck-reg': 0.6,
  'ldo-reg': 0.6,
  inductor: 0.48,
  flash: 0.75,
  crystal: 0.42,
  'esd-protection': 0.42,
  'test-points': 0.22,
  'usb-c': 0.25,
  'battery-connector': 0.6,
  'io-header': 0.25,
  'status-leds': 0.38,
  'audio-harness': 0.35,
  'main-pcb': 0,
  passives: 0.3,
}

/* ------------------------------------------------------------------ */
/*  Helper to compute vertical offset for any component                 */
/* ------------------------------------------------------------------ */
import { useViewer } from './viewer'

export function useComponentLift(id?: string): number {
  const { pcbExplode, pcbComponentExplode } = useViewer()
  if (!pcbExplode || !id) return 0
  const lift = LIFT_MAP[id] ?? 0
  const extra = pcbComponentExplode === id ? 2.6 : 0
  return lift + extra
}
