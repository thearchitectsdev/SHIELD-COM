import { Assy } from '../lib/viewer'
import { TopMarkings } from './Decals'
import { Gasket, LowerEnclosure, UpperEnclosure } from './Enclosure'
import { HostRadio, RadioCable } from './Radio'
import { PcbBottom, PcbFlip } from './PcbFaces'
import {
  AnalogFilter,
  AudioCodec,
  Esp32,
  Esp32Shield,
  MainPcb,
  MemoryAndPassives,
  PcbConnectors,
  PowerSection,
  StatusLeds,
} from './Pcb'
import {
  AcousticDucts,
  AcousticGaskets,
  AcousticMesh,
  AudioConnector,
  AudioHarness,
  Battery,
  BatteryCable,
  CableManagement,
  InternalFrame,
  LightPipes,
  MarkButton,
  Microphones,
  MountingBracket,
  PowerSwitch,
  Screws,
  SosButton,
  Standoffs,
  ThreadedInserts,
} from './Systems'

export function ShieldCom() {
  return (
    <group>
      {/* ============ ENCLOSURE ============ */}
      <Assy ex={[0, 2.55, 0]}>
        <UpperEnclosure />
        <TopMarkings />
      </Assy>
      <Assy ex={[0, 2.05, 0]}>
        <Gasket />
      </Assy>
      <Assy ex={[0, -2.5, 0]}>
        <LowerEnclosure />
      </Assy>

      {/* ============ STATUS INDICATORS ============ */}
      <Assy ex={[0, 1.72, 0]}>
        <LightPipes />
      </Assy>

      {/* ============ CONTROLS ============ */}
      <Assy ex={[0, 1.4, 0]} px={[0, 1.0, 0]}>
        <SosButton />
      </Assy>
      <Assy ex={[0, 1.4, 0]} px={[0, 1.0, 0]}>
        <MarkButton />
      </Assy>
      <Assy ex={[0, 1.4, 0]} px={[0, 1.0, 0]}>
        <PowerSwitch />
      </Assy>

      {/* ============ ACOUSTIC STRUCTURE ============ */}
      <Assy ex={[0, 1.05, 0]}>
        <AcousticMesh />
      </Assy>
      <Assy ex={[0, 1.05, 0]}>
        <AcousticDucts />
      </Assy>
      <Assy ex={[0, 1.05, 0]}>
        <AcousticGaskets />
      </Assy>

      {/* ============ MAIN PCB ASSEMBLY ============ */}
      <Assy ex={[0, 0.55, 0]}>
       <PcbFlip>
        <Assy px={[0, -0.45, 0]}>
          <MainPcb />
          <PcbBottom />
        </Assy>
        <Assy px={[0, 0.95, 0]}>
          <Esp32 />
        </Assy>
        <Assy px={[0, 1.45, 0]}>
          <Esp32Shield />
        </Assy>
        <Assy px={[0, 0.75, 0]}>
          <AudioCodec />
        </Assy>
        <Assy px={[0, 0.6, 0]}>
          <AnalogFilter />
        </Assy>
        <Assy px={[0, 0.65, 0]}>
          <PowerSection />
        </Assy>
        <Assy px={[0, 0.5, 0]}>
          <MemoryAndPassives />
        </Assy>
        <Assy px={[0, 0.6, 0]}>
          <PcbConnectors />
        </Assy>
        <Assy px={[0, 0.5, 0]}>
          <StatusLeds />
        </Assy>
        <Assy px={[0, 0.4, 0]}>
          <Microphones />
        </Assy>
        <Assy px={[0, 0.3, 0]}>
          <AudioHarness />
        </Assy>
       </PcbFlip>
      </Assy>

      {/* ============ POWER SUBSYSTEM ============ */}
      <Assy ex={[0, -0.8, 0]}>
        <Battery />
      </Assy>
      <Assy ex={[0, -0.8, 0]}>
        <BatteryCable />
      </Assy>

      {/* ============ INTERNAL FRAME ============ */}
      <Assy ex={[0, -1.6, 0]}>
        <InternalFrame />
      </Assy>
      <Assy ex={[0, -1.6, 0]}>
        <CableManagement />
      </Assy>

      {/* ============ MECHANICAL ============ */}
      <Assy ex={[0, -0.55, 0]}>
        <Standoffs />
      </Assy>
      <Assy ex={[0, -2.95, 0]}>
        <Screws />
      </Assy>
      <Assy ex={[0, -2.95, 0]}>
        <ThreadedInserts />
      </Assy>
      <Assy ex={[0, -3.8, 0]}>
        <MountingBracket />
      </Assy>

      {/* ============ EXTERNAL INTERFACES ============ */}
      <Assy ex={[0, -2.5, 0]}>
        <AudioConnector />
      </Assy>
      {/* the external cable stays plugged into the static host radio */}
      <Assy>
        <RadioCable />
      </Assy>
      <Assy>
        <HostRadio />
      </Assy>
    </group>
  )
}
