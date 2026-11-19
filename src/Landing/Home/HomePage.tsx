import HeroSection from "./HeroSection";
import StatsSection from "./StatsSection";
import PlatformOverviewSection from "./PlatformOverviewSection";
import FeaturesSection from "./FeaturesSection";
import AudienceSection from "./AudienceSection";
import TestimonialsSection from "./TestimonialsSection";
import FaqSection from "./FaqSection";

/** Home page = stack of sections. ContactUsSection lives in the footer so every page gets it. */
const HomePage = () => (
  <main>
    <HeroSection />
    <StatsSection />
    <PlatformOverviewSection />
    <FeaturesSection />
    <AudienceSection />
    <TestimonialsSection />
    <FaqSection />
  </main>
);

export default HomePage;
