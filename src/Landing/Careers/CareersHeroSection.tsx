import React from "react";
import { motion } from "framer-motion";
import { HighlightWord, Ring, SectionLabel, Sparkle } from "../Shared/index";

/** Top of the Careers page. */
const CareersHeroSection: React.FC = () => (
  <section aria-labelledby="careers-hero-title" className="lp-section relative overflow-hidden text-center">
    <Sparkle className="absolute left-[10%] top-[26%] lp-bob hidden md:block" size={30} />
    <Ring className="absolute right-[12%] top-[22%] hidden md:block" color="var(--lp-yellow)" />
    <div className="lp-container relative">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionLabel>Join our mission</SectionLabel>
      </motion.div>
      <motion.h1
        id="careers-hero-title"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="lp-h1 mt-6 mx-auto max-w-4xl"
      >
        Help shape the <br className="hidden sm:block" /> future of <HighlightWord>education.</HighlightWord>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="lp-lead mt-6 mx-auto max-w-2xl"
      >
        Team up with 50+ builders who are changing <strong style={{ color: "var(--lp-ink)" }}>how Nigeria learns</strong>. Work from Lagos, Abuja or wherever you do your best thinking.
      </motion.p>
    </div>
  </section>
);

export default CareersHeroSection;
