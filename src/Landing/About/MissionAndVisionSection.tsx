import React from "react";
import { motion } from "framer-motion";
import { Compass, Target } from "lucide-react";
import { BentoTile, SectionLabel } from "../Shared/index";

const fade = { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

/** Two side-by-side pastel tiles: what we do (mission) and where we are heading (vision). */
const MissionAndVisionSection: React.FC = () => (
  <section aria-labelledby="mission-vision-title" className="lp-section">
    <div className="lp-container">
      <div className="text-center max-w-2xl mx-auto">
        <SectionLabel dot tone="green">Why we exist</SectionLabel>
        <h2 id="mission-vision-title" className="lp-h2 mt-5">What we do, and <span className="lp-gradient-text">where we’re going</span></h2>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-6">
        <motion.div {...fade}>
          <BentoTile tone="green" className="h-full">
            <Target size={34} style={{ color: "var(--lp-green-text)" }} />
            <h3 className="lp-h3 mt-5" style={{ fontSize: "1.9rem" }}>Our mission</h3>
            <p className="mt-4 leading-relaxed lp-muted">
              To put a world-class education within reach of <strong style={{ color: "var(--lp-ink)" }}>every child</strong>, with real teachers, real friends and real joy, without leaving home.
            </p>
            <p className="mt-3 leading-relaxed lp-muted">We swap chaos for structure, fear for confidence and loneliness for community.</p>
            <p className="mt-5 text-lg font-semibold">Education isn’t a privilege. At Yare Height, it’s a promise.</p>
          </BentoTile>
        </motion.div>

        <motion.div {...fade} transition={{ duration: 0.6, delay: 0.1 }}>
          <BentoTile tone="yellow" className="h-full">
            <Compass size={34} style={{ color: "var(--lp-yellow-text)" }} />
            <h3 className="lp-h3 mt-5" style={{ fontSize: "1.9rem" }}>Our vision</h3>
            <p className="mt-4 leading-relaxed lp-muted">
              Every child wakes up <strong style={{ color: "var(--lp-ink)" }}>eager to learn</strong>, grows in confidence and passes exams with pride.
            </p>
            <p className="mt-3 leading-relaxed lp-muted">No traffic jams, no lost school days, no safety worries. Just joyful, effective learning that’s rooted in our culture.</p>
            <p className="mt-5 text-lg font-semibold">That future begins today, with Yare Height Learning Hub.</p>
          </BentoTile>
        </motion.div>
      </div>
    </div>
  </section>
);

export default MissionAndVisionSection;
