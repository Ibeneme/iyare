import React from "react";
import AboutHeroSection from "./AboutHeroSection";
import AboutStatsSection from "./AboutStatsSection";
import MissionAndVisionSection from "./MissionAndVisionSection";
import FounderStorySection from "./FounderStorySection";
import ValuesSection from "./ValuesSection";
import WhatYouGetSection from "./WhatYouGetSection";
import ForParentsAndStudentsSection from "./ForParentsAndStudentsSection";

/** About page: who we are, why we exist and what families get. */
const AboutPage: React.FC = () => (
  <main>
    <AboutHeroSection />
    <AboutStatsSection />
    <MissionAndVisionSection />
    <FounderStorySection />
    <ValuesSection />
    <WhatYouGetSection />
    <ForParentsAndStudentsSection />
  </main>
);

export default AboutPage;
