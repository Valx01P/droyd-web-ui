import { FinalTransmission } from "./components/FinalTransmission";
import { HeroTrailer } from "./components/HeroTrailer";
import { LabEvidence } from "./components/LabEvidence";
import { OriginDossier } from "./components/OriginDossier";
import { SiteMotion } from "./components/SiteMotion";

export default function Home() {
  return (
    <SiteMotion>
      <main className="site-shell">
        <HeroTrailer />
        <OriginDossier />
        <LabEvidence />
        <FinalTransmission />
      </main>
    </SiteMotion>
  );
}
