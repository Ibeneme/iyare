import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HighlightWord, Plus, Ring, SectionLabel, Sparkle } from "../Shared/index";
import { PATHS } from "../../routes/paths";

/** Top of the About page: label, headline, intro and two calls to action. */
const AboutHeroSection: React.FC = () => (
  <section aria-labelledby="about-hero-title" className="lp-section relative overflow-hidden text-center">
    <Sparkle className="absolute left-[9%] top-[22%] lp-bob hidden md:block" size={30} />
    <Ring className="absolute right-[10%] top-[18%] hidden md:block" />
    <Plus className="absolute right-[18%] bottom-[18%] hidden lg:block" />

    <div className="lp-container relative">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionLabel>Trusted by 15,000+ families</SectionLabel>
      </motion.div>

      <motion.h1
        id="about-hero-title"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="lp-h1 mt-6 mx-auto max-w-4xl"
      >
        A real school, <br className="hidden sm:block" />
        built for <HighlightWord>your home.</HighlightWord>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="lp-lead mt-6 mx-auto max-w-2xl"
      >
        Yare Height Learning Hub is a complete online school: live classes, caring teachers, classmates, exams and plenty of joy, all reachable from your living room.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <Link to={PATHS.register} className="lp-btn lp-btn--yellow lp-btn--lg">
          Try it free for 7 days <ArrowRight size={18} />
        </Link>
        <Link to={PATHS.subjectsOverview} className="lp-btn lp-btn--dark lp-btn--lg">Browse subjects</Link>
      </motion.div>
    </div>
  </section>
);

export default AboutHeroSection;
