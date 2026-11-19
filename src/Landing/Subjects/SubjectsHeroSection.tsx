import React from "react";
import { motion } from "framer-motion";
import { HighlightWord, Plus, Ring, SectionLabel, Sparkle } from "../Shared/index";

/** Top of the Subjects page. */
const SubjectsHeroSection: React.FC = () => (
  <section aria-labelledby="subjects-hero-title" className="lp-section relative overflow-hidden text-center">
    <Sparkle className="absolute right-[11%] top-[24%] lp-bob hidden md:block" size={30} />
    <Ring className="absolute left-[10%] top-[30%] hidden md:block" />
    <Plus className="absolute left-[20%] bottom-[14%] hidden lg:block" color="var(--lp-yellow)" />
    <div className="lp-container relative">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionLabel>The Yare Height curriculum</SectionLabel>
      </motion.div>
      <motion.h1
        id="subjects-hero-title"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="lp-h1 mt-6 mx-auto max-w-4xl"
      >
        Pick the <HighlightWord>subjects</HighlightWord> <br className="hidden sm:block" /> your child loves.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="lp-lead mt-6 mx-auto max-w-2xl"
      >
        From WAEC and JAMB to BECE and beyond, we cover <strong style={{ color: "var(--lp-ink)" }}>any subject</strong> your child needs, all in one place.
      </motion.p>
    </div>
  </section>
);

export default SubjectsHeroSection;
