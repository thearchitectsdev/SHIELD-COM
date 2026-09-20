import { useEffect, useState } from "react";
import Viewer from "@/components/Viewer";
import { Demo } from "@/components/Demo";
import Deck from "@/components/Deck";
import { Architecture, Controls, Engineering, FieldUse, Footer, Hero, Nav, Overview, PcbSystems, Section } from "@/components/Sections";

function ViewerSection() {
  return (
    <Section
      id="viewer"
      eyebrow="Interactive 3D viewer"
      title="The whole module, taken apart and put back together"
      lead="Orbit, zoom and pan the assembly. Switch between the sealed unit, the exploded assembly order, the populated board and the internal chain — then isolate a single system or focus a single component."
      tone="amber"
    >
      <Viewer />
      <div className="mt-3 grid gap-px overflow-hidden rounded-sm border border-graphite-700 bg-graphite-700 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Assembled", "Sealed enclosure with only the SOS and MARK controls, four status LEDs, both cable exits and the USB-C service port."],
          ["Exploded", "Lid, seal, frame, board, cell, shields and fasteners separate along one controlled assembly axis and return exactly."],
          ["PCB detail", "Only the populated board and its cabling context. Lift the packages for inspection, then seat them again."],
          ["Internal", "The shell becomes a ghost so the audio chain and power chain can be followed through the enclosure."],
        ].map(([t, d]) => (
          <div key={t} className="bg-graphite-950 p-4">
            <div className="mono-label text-cyan-tech/80">{t}</div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-graphite-400">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** tiny hash router — re-renders when the hash actually changes */
function useHashRoute() {
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  // #/deck renders only the SIH presentation — the website itself is untouched.
  const onDeck = hash === "#/deck" || (typeof window !== "undefined" && window.location.pathname === "/deck");
  if (onDeck) return <Deck />;

  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-200 antialiased">
      <Nav />
      <main>
        <Hero />
        <Overview />
        <ViewerSection />
        <Demo />
        <Architecture />
        <PcbSystems />
        <Controls />
        <Engineering />
        <FieldUse />
      </main>
      <Footer />
    </div>
  );
}
