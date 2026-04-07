import { Nav } from "@/components/cadence/Nav";
import { Hero } from "@/components/cadence/Hero";
import { StatsBar } from "@/components/cadence/StatsBar";
import { FeatureShowcase } from "@/components/cadence/FeatureShowcase";
import { PhaseCalendar } from "@/components/cadence/PhaseCalendar";
import { DebriefSection } from "@/components/cadence/DebriefSection";
import { Testimonials } from "@/components/cadence/Testimonials";
import { Pricing } from "@/components/cadence/Pricing";
import { DownloadCta } from "@/components/cadence/DownloadCta";
import { FaqSection } from "@/components/cadence/FaqSection";
import { CadenceFooter } from "@/components/cadence/Footer";

export default function Home() {
  return (
    <div>
      <Nav />
      <Hero />
      <StatsBar />
      <FeatureShowcase />
      <PhaseCalendar />
      <DebriefSection />
      <Testimonials />
      <Pricing />
      <DownloadCta />
      <FaqSection />
      <CadenceFooter />
    </div>
  );
}
