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
  /* ---------------------------------------------------------------- *
   *  ENCLOSURE — glass-filled PC/ABS, painted graphite over a         *
   *  metallic base coat with a satin lacquer on top. Reads as         *
   *  machined hardware rather than moulded plastic.                   *
   * ---------------------------------------------------------------- */
  shell: { color: '#2b2f33', roughness: 0.42, metalness: 0.46, clearcoat: 0.45, clearcoatRoughness: 0.22, envIntensity: 1.05 },
  shellTop: { color: '#33383d', roughness: 0.38, metalness: 0.5, clearcoat: 0.52, clearcoatRoughness: 0.18, envIntensity: 1.1 },
  /* raw moulded interior: unpainted, so no lacquer and no metal flake */
  shellIn: { color: '#191c1f', roughness: 0.82, metalness: 0.04 },
  /* clear-anodised aluminium trim */
  shellTrim: { color: '#5a6169', roughness: 0.22, metalness: 0.95, clearcoat: 0.2, clearcoatRoughness: 0.14, envIntensity: 1.25 },
  seam: { color: '#090b0c', roughness: 0.9, metalness: 0.05 },

  /* ---------------------------------------------------------------- *
   *  ELASTOMERS — TPE, silicone, rubber. Never metallic.              *
   * ---------------------------------------------------------------- */
  rubber: { color: '#141619', roughness: 0.95, metalness: 0.0 },
  gasket: { color: '#1a1d22', roughness: 0.98, metalness: 0.0, clearcoat: 0.1, clearcoatRoughness: 0.6 },
  bumper: { color: '#1b1e21', roughness: 0.92, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.55 },

  /* ---------------------------------------------------------------- *
   *  PCB — matte-black FR4 soldermask (a dielectric with a sheen),    *
   *  ENIG gold finish, exposed copper where it is not covered.        *
   * ---------------------------------------------------------------- */
  pcb: { color: '#10241c', roughness: 0.45, metalness: 0.02, clearcoat: 0.25, clearcoatRoughness: 0.35 },
  pcbEdge: { color: '#0b1a14', roughness: 0.72, metalness: 0.0 },
  copper: { color: '#a8834a', roughness: 0.28, metalness: 0.9 },
  gold: { color: '#d4af5a', roughness: 0.18, metalness: 1.0, envIntensity: 1.15 },
  silver: { color: '#ccd3d9', roughness: 0.16, metalness: 0.95 },
  solder: { color: '#c8cdd2', roughness: 0.18, metalness: 0.92 },
  silkscreen: { color: '#d8dde0', roughness: 0.62, metalness: 0.0 },
  conformal: { color: '#1b2a20', roughness: 0.35, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.2 },
  kapton: { color: '#c98a2e', roughness: 0.5, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.4 },
  potting: { color: '#141719', roughness: 0.6, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.4 },

  /* ---------------------------------------------------------------- *
   *  SEMICONDUCTORS — epoxy mould compound is a dielectric; the       *
   *  cans and shields are plated steel.                               *
   * ---------------------------------------------------------------- */
  ic: { color: '#14161a', roughness: 0.58, metalness: 0.02 },
  icLid: { color: '#1e2329', roughness: 0.3, metalness: 0.9 },
  shield: { color: '#b8c0c8', roughness: 0.22, metalness: 0.95, envIntensity: 1.15 },
  crystal: { color: '#9aa1a9', roughness: 0.2, metalness: 0.95 },
  epoxy: { color: '#1a1c20', roughness: 0.55, metalness: 0.02, clearcoat: 0.25, clearcoatRoughness: 0.35 },

  /* ---------------------------------------------------------------- *
   *  PASSIVES — alumina, ceramic, ferrite: all dielectrics.           *
   * ---------------------------------------------------------------- */
  res: { color: '#232326', roughness: 0.42, metalness: 0.03, clearcoat: 0.3, clearcoatRoughness: 0.3 },
  cap: { color: '#b5a184', roughness: 0.5, metalness: 0.03, clearcoat: 0.2, clearcoatRoughness: 0.35 },
  tant: { color: '#c9a227', roughness: 0.45, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  elec: { color: '#1c1f23', roughness: 0.42, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.28 },
  ind: { color: '#2a2a2e', roughness: 0.62, metalness: 0.04 },
  ferrite: { color: '#26262a', roughness: 0.66, metalness: 0.04 },

  /* ---------------------------------------------------------------- *
   *  MECHANICS — machined metals and engineering polymers.            *
   * ---------------------------------------------------------------- */
  steel: { color: '#9aa1a8', roughness: 0.24, metalness: 0.95, envIntensity: 1.1 },
  darkSteel: { color: '#666d74', roughness: 0.34, metalness: 0.85 },
  brass: { color: '#b9954a', roughness: 0.26, metalness: 0.95 },
  chrome: { color: '#d5dae0', roughness: 0.08, metalness: 1.0, envIntensity: 1.4 },
  alu: { color: '#5c636a', roughness: 0.4, metalness: 0.8, clearcoat: 0.28, clearcoatRoughness: 0.25, envIntensity: 1.1 },
  darkPoly: { color: '#1e2227', roughness: 0.45, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.3 },
  nylon: { color: '#2a2e33', roughness: 0.48, metalness: 0.03, clearcoat: 0.25, clearcoatRoughness: 0.35 },
  /* internal chassis: clear-anodised aluminium */
  frame: { color: '#2e3438', roughness: 0.42, metalness: 0.75, clearcoat: 0.25, clearcoatRoughness: 0.3, envIntensity: 1.0 },
  frameAlt: { color: '#383f44', roughness: 0.44, metalness: 0.7, clearcoat: 0.22, clearcoatRoughness: 0.32 },
  thermalPad: { color: '#3a3f44', roughness: 0.85, metalness: 0.0 },
  adhesive: { color: '#2a2c2a', roughness: 0.7, metalness: 0.0 },
  label: { color: '#d9d5cb', roughness: 0.68, metalness: 0.0 },

  /* ---------------------------------------------------------------- *
   *  AUDIO — metal mesh over moulded ducts.                           *
   * ---------------------------------------------------------------- */
  mic: { color: '#2a2e33', roughness: 0.45, metalness: 0.6 },
  micPort: { color: '#0d0f11', roughness: 1.0, metalness: 0.0 },
  /* woven stainless: it is metal, and it catches the key light */
  meshDisc: { color: '#33383d', roughness: 0.4, metalness: 0.85, envIntensity: 1.05 },
  duct: { color: '#191c20', roughness: 0.85, metalness: 0.02 },

  /* ---------------------------------------------------------------- *
   *  CONTROLS — rubberised actuators, machined bezels.                *
   * ---------------------------------------------------------------- */
  sos: { color: '#9e3524', roughness: 0.6, metalness: 0.0, clearcoat: 0.2, clearcoatRoughness: 0.45 },
  sosDark: { color: '#5f2015', roughness: 0.65, metalness: 0.0 },
  sosRing: { color: '#4a5057', roughness: 0.24, metalness: 0.9, envIntensity: 1.1 },
  mark: { color: '#33383e', roughness: 0.62, metalness: 0.0, clearcoat: 0.2, clearcoatRoughness: 0.45 },
  markRib: { color: '#868e96', roughness: 0.3, metalness: 0.8 },

  /* ---------------------------------------------------------------- *
   *  POWER — shrink-wrapped cell, PVC wire insulation.                *
   * ---------------------------------------------------------------- */
  batt: { color: '#343b57', roughness: 0.45, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.3 },
  battWrap: { color: '#252b42', roughness: 0.5, metalness: 0.03, clearcoat: 0.3, clearcoatRoughness: 0.35 },
  wireRed: { color: '#8e2b25', roughness: 0.7, metalness: 0.0 },
  wireBlk: { color: '#191b1e', roughness: 0.7, metalness: 0.0 },
  cable: { color: '#212529', roughness: 0.8, metalness: 0.0 },

  /* ---------------------------------------------------------------- *
   *  INDICATORS — glossy polycarbonate optics.                        *
   * ---------------------------------------------------------------- */
  lightPipe: { color: '#e6eef2', roughness: 0.08, metalness: 0.0, opacity: 0.38, transparent: true, clearcoat: 1, clearcoatRoughness: 0.06 },
  window: { color: '#15191d', roughness: 0.12, metalness: 0.05, opacity: 0.62, transparent: true, clearcoat: 1, clearcoatRoughness: 0.08 },
  windowBezel: { color: '#4a5057', roughness: 0.28, metalness: 0.7 },
  ledGreen: { color: '#15311d', roughness: 0.3, metalness: 0.0, emissive: '#3ddc84', emissiveIntensity: 1.0 },
  ledBlue: { color: '#0f2238', roughness: 0.3, metalness: 0.0, emissive: '#3aa0ff', emissiveIntensity: 0.85 },
  ledAmber: { color: '#3a2c0e', roughness: 0.3, metalness: 0.0, emissive: '#f0a63a', emissiveIntensity: 0.9 },
  ledRed: { color: '#3a1512', roughness: 0.3, metalness: 0.0, emissive: '#ff4d4d', emissiveIntensity: 0.85 },

  /* ---------------------------------------------------------------- *
   *  HOST RADIO — olive-drab tactical handheld, kept deliberately     *
   *  flatter than the module so the product stays the hero.           *
   * ---------------------------------------------------------------- */
  radio: { color: '#4b5a3a', roughness: 0.74, metalness: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.5 },
  radioDark: { color: '#37432b', roughness: 0.8, metalness: 0.02 },
  radioPanel: { color: '#1f231c', roughness: 0.72, metalness: 0.02 },
  radioPlate: { color: '#2c3524', roughness: 0.7, metalness: 0.03 },
  radioBlk: { color: '#14171a', roughness: 0.88, metalness: 0.02 },
  radioRub: { color: '#101312', roughness: 0.96, metalness: 0.0 },
  key: { color: '#1e231a', roughness: 0.58, metalness: 0.02 },
  keyLight: { color: '#5a684a', roughness: 0.55, metalness: 0.02 },
  screenBk: { color: '#080f0a', roughness: 0.25, metalness: 0.1, emissive: '#12301c', emissiveIntensity: 0.4 },
  screenTx: { color: '#12301e', emissive: '#5fdd82', emissiveIntensity: 0.85, roughness: 0.3, metalness: 0.0 },
  screenAmberTx: { color: '#33270c', emissive: '#e8b44a', emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.0 },
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
