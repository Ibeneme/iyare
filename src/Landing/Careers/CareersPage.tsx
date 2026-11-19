import React from "react";
import CareersHeroSection from "./CareersHeroSection";
import CompanyFactsSection from "./CompanyFactsSection";
import OpenRolesSection from "./OpenRolesSection";
import WorkCultureSection from "./WorkCultureSection";

/** Careers page: why join us, open roles and our culture. */
const CareersPage: React.FC = () => (
  <main>
    <CareersHeroSection />
    <CompanyFactsSection />
    <OpenRolesSection />
    <WorkCultureSection />
  </main>
);

export default CareersPage;
