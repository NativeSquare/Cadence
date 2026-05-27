import { Nav } from "@/components/cadence/Nav";
import { Hero } from "@/components/cadence/Hero";
import { StatsBar } from "@/components/cadence/StatsBar";
import { FeatureShowcase } from "@/components/cadence/FeatureShowcase";
import { MarketLandscape } from "@/components/cadence/MarketLandscape";
import { DebriefSection } from "@/components/cadence/DebriefSection";
import { Testimonials } from "@/components/cadence/Testimonials";
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
      <MarketLandscape />
      <DebriefSection />
      <Testimonials />
      <DownloadCta />
      <FaqSection />
      <CadenceFooter />
    </div>
  );
}
