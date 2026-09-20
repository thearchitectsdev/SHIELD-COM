import { createContext, useContext } from "react";
import type { ModeId, SystemId } from "@/data/parts";

export interface ViewerApi {
  mode: ModeId;
  labels: boolean;
  dims: boolean;
  pcbSpread: boolean;
  showContext: boolean;
  isolate: SystemId | null;
  selected: string | null;
  hovered: string | null;
  labelSet: Set<string>;
  setSelected: (id: string | null) => void;
  setHovered: (id: string | null) => void;
}

export const ViewerCtx = createContext<ViewerApi>({
  mode: "assembled",
  labels: false,
  dims: false,
  pcbSpread: false,
  showContext: true,
  isolate: null,
  selected: null,
  hovered: null,
  labelSet: new Set<string>(),
  setSelected: () => {},
  setHovered: () => {},
});

export const useViewer = () => useContext(ViewerCtx);

/** parts rendered as cut-away ghosts in INTERNAL mode */
export const GHOSTED = new Set([
  "upper-enclosure",
  "lower-enclosure",
  "gasket",
  "control-guards",
  "sos-control",
  "mark-control",
  "led-pipes",
  "acoustic-inlet",
  "strain-relief",
  "host-radio",
]);
