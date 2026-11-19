import React from "react";
import SubjectsHeroSection from "./SubjectsHeroSection";
import SubjectsGridSection from "./SubjectsGridSection";
import SubjectsTrustSection from "./SubjectsTrustSection";

/** Public overview of the subjects Yare Height teaches. */
const SubjectsOverviewPage: React.FC = () => (
  <main>
    <SubjectsHeroSection />
    <SubjectsGridSection />
    <SubjectsTrustSection />
  </main>
);

export default SubjectsOverviewPage;
