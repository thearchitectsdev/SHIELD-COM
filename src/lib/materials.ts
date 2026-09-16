export type MatSpec = {
  color: string
  roughness?: number
  metalness?: number
  /* lacquer layer — reads as anodised / painted metal instead of raw plastic */
  clearcoat?: number
  clearcoatRoughness?: number
  envIntensity?: number
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
  transparent?: boolean
}

export const M: Record<string, MatSpec> = {
  /* ---- enclosure (dense, machined-graphite look: metallic base coat
          under a thin satin lacquer, so it reads as hardware, not plastic) ---- */
  shell: { color: '#2b2f33', roughness: 0.42, metalness: 0.46, clearcoat: 0.45, clearcoatRoughness: 0.22, envIntensity: 1.05 },
  shellTop: { color: '#33383d', roughness: 0.38, metalness: 0.5, clearcoat: 0.52, clearcoatRoughness: 0.18, envIntensity: 1.1 },
  shellIn: { color: '#191c1f', roughness: 0.78, metalness: 0.18, clearcoat: 0.14, clearcoatRoughness: 0.4 },
  shellTrim: { color: '#4a5057', roughness: 0.26, metalness: 0.88, clearcoat: 0.3, clearcoatRoughness: 0.12, envIntensity: 1.2 },
  seam: { color: '#090b0c', roughness: 0.9, metalness: 0.05 },
  rubber: { color: '#141619', roughness: 0.94, metalness: 0.02 },
  gasket: { color: '#1a1d22', roughness: 0.97, metalness: 0.03 },
  bumper: { color: '#1b1e21', roughness: 0.9, metalness: 0.06, clearcoat: 0.18, clearcoatRoughness: 0.55 },

  /* ---- pcb (matte-black flagship soldermask, ENIG gold) ---- */
  pcb: { color: '#10241c', roughness: 0.5, metalness: 0.08 },
  pcbEdge: { color: '#0b1a14', roughness: 0.6, metalness: 0.06 },
  copper: { color: '#a8834a', roughness: 0.3, metalness: 0.85 },
  gold: { color: '#c9a44e', roughness: 0.24, metalness: 0.95 },
  silver: { color: '#c9d0d6', roughness: 0.22, metalness: 0.96 },

  /* ---- semiconductors ---- */
  ic: { color: '#111316', roughness: 0.42, metalness: 0.14 },
  icLid: { color: '#1a1d21', roughness: 0.36, metalness: 0.22 },
  shield: { color: '#b0b8c0', roughness: 0.26, metalness: 0.92 },
  crystal: { color: '#969da5', roughness: 0.24, metalness: 0.92 },

  /* ---- passives ---- */
  res: { color: '#232326', roughness: 0.55, metalness: 0.05 },
  cap: { color: '#b5a184', roughness: 0.44, metalness: 0.08 },
  tant: { color: '#c9a227', roughness: 0.45, metalness: 0.08 },
  elec: { color: '#1c1f23', roughness: 0.48, metalness: 0.4 },
  ind: { color: '#2b2b30', roughness: 0.55, metalness: 0.45 },

  /* ---- mechanics (satin machined metals) ---- */
  steel: { color: '#9aa1a8', roughness: 0.24, metalness: 0.94 },
  darkSteel: { color: '#666d74', roughness: 0.3, metalness: 0.88 },
  brass: { color: '#b9954a', roughness: 0.28, metalness: 0.92 },
  darkPoly: { color: '#1e2227', roughness: 0.48, metalness: 0.3, clearcoat: 0.22, clearcoatRoughness: 0.3 },
  frame: { color: '#282d31', roughness: 0.5, metalness: 0.38, clearcoat: 0.24, clearcoatRoughness: 0.3 },
  frameAlt: { color: '#30363b', roughness: 0.5, metalness: 0.38, clearcoat: 0.24, clearcoatRoughness: 0.3 },

  /* ---- audio ---- */
  mic: { color: '#26292e', roughness: 0.6, metalness: 0.35 },
  micPort: { color: '#0d0f11', roughness: 1.0 },
  meshDisc: { color: '#2b2f34', roughness: 0.95, metalness: 0.3 },
  duct: { color: '#191c20', roughness: 0.85 },

  /* ---- controls (rubberized technical polymer, machined rings) ---- */
  sos: { color: '#9e3524', roughness: 0.62, metalness: 0.04 },
  sosDark: { color: '#5f2015', roughness: 0.68 },
  sosRing: { color: '#3f444a', roughness: 0.3, metalness: 0.6 },
  mark: { color: '#33383e', roughness: 0.66, metalness: 0.06 },
  markRib: { color: '#7d858d', roughness: 0.34, metalness: 0.55 },

  /* ---- power ---- */
  batt: { color: '#343b57', roughness: 0.44, metalness: 0.3 },
  battWrap: { color: '#252b42', roughness: 0.5, metalness: 0.2 },
  wireRed: { color: '#8e2b25', roughness: 0.72 },
  wireBlk: { color: '#191b1e', roughness: 0.72 },
  cable: { color: '#212529', roughness: 0.74 },

  /* ---- indicators (recessed, restrained) ---- */
  lightPipe: { color: '#e6eef2', roughness: 0.1, metalness: 0.0, opacity: 0.38, transparent: true },
  window: { color: '#15191d', roughness: 0.16, metalness: 0.05, opacity: 0.62, transparent: true },
  windowBezel: { color: '#43484e', roughness: 0.3, metalness: 0.5 },
  ledGreen: { color: '#15311d', emissive: '#3ddc84', emissiveIntensity: 1.0 },
  ledBlue: { color: '#0f2238', emissive: '#3aa0ff', emissiveIntensity: 0.85 },
  ledAmber: { color: '#3a2c0e', emissive: '#f0a63a', emissiveIntensity: 0.9 },
  ledRed: { color: '#3a1512', emissive: '#ff4d4d', emissiveIntensity: 0.85 },

  /* ---- host radio reference (olive-drab tactical handheld) ---- */
  radio: { color: '#4b5a3a', roughness: 0.74, metalness: 0.06 },
  radioDark: { color: '#37432b', roughness: 0.8, metalness: 0.05 },
  radioPanel: { color: '#1f231c', roughness: 0.72, metalness: 0.06 },
  radioPlate: { color: '#2c3524', roughness: 0.7, metalness: 0.08 },
  radioBlk: { color: '#14171a', roughness: 0.88, metalness: 0.08 },
  radioRub: { color: '#101312', roughness: 0.96, metalness: 0.0 },
  key: { color: '#1e231a', roughness: 0.58, metalness: 0.06 },
  keyLight: { color: '#5a684a', roughness: 0.55, metalness: 0.06 },
  screenBk: { color: '#080f0a', roughness: 0.25, metalness: 0.1, emissive: '#12301c', emissiveIntensity: 0.4 },
  screenTx: { color: '#12301e', emissive: '#5fdd82', emissiveIntensity: 0.85, roughness: 0.3 },
  screenAmberTx: { color: '#33270c', emissive: '#e8b44a', emissiveIntensity: 0.8, roughness: 0.3 },
}

/* ------------------------------------------------------------------ */
/*  GLOBAL DIMENSIONS  (units = centimetres, 1 unit = 10 mm)           */
/* ------------------------------------------------------------------ */
export const DIM = {
  /* outer envelope */
  ox: 3.6,
  oz: 2.5,
  yBottom: -1.25,
  yTop: 1.4,
  wall: 0.22,
  floor: 0.25,
  innerX: 3.38,
  innerZ: 2.28,
  /* split line */
  crown: 0.72, // top of lower-shell walls (gasket seat)
  gasketY0: 0.72,
  gasketY1: 0.84,
  lidY0: 0.84,
  ceilY0: 1.18,
  ceilY1: 1.4,
  /* pcb */
  pcbX: 3.1,
  pcbZ0: -2.02,
  pcbZ1: 1.58,
  pcbY0: 0.28,
  pcbY1: 0.44,
  pcbTh: 0.16,
  /* battery */
  battY0: -0.98,
  battY1: -0.42,
  battX0: -2.4,
  battX1: 1.8,
  battZ: 1.4,
  /* frame */
  frX: 3.36,
  frZ: 2.26,
  frY0: -1.0,
  frY1: -0.3,
}
