import React from "react";
import { motion } from "framer-motion";
import { PersonAvatar, SectionLabel } from "../Shared/index";

/** The founder's story on the left, a profile card on the right. */
const FounderStorySection: React.FC = () => (
  <section aria-labelledby="founder-title" className="lp-section pt-0">
    <div className="lp-container">
      <div className="lp-card lp-card--sand p-8 md:p-14 grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <SectionLabel dot>Our story</SectionLabel>
          <h2 id="founder-title" className="lp-h2 mt-5">One idea that grew into a movement</h2>
          <div className="mt-6 space-y-4 leading-relaxed lp-muted text-lg">
            <p>
              In 2021, <strong style={{ color: "var(--lp-ink)" }}>Onyekachi</strong> watched children slip behind while schools were closed. Private tutors cost too much, and video clips alone weren’t teaching anyone.
            </p>
            <p>
              He asked a simple question: <strong style={{ color: "var(--lp-ink)" }}>“Why can’t kids get a full school day from home?”</strong>
            </p>
            <p>
              So he built Yare Height Learning Hub, with live classes, real friendships, a proper routine and lots of fun. Today it is one of Nigeria’s fastest-growing online schools.
            </p>
          </div>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="lp-card p-8 text-center"
        >
          <PersonAvatar variant={1} size={132} className="mx-auto" />
          <figcaption className="mt-5">
            <span className="block lp-h3">Iyare Onyekachukwu</span>
            <span className="block mt-1 font-semibold" style={{ color: "var(--lp-green-text)" }}>Founder & CEO</span>
            <span className="block mt-3 text-sm lp-muted max-w-xs mx-auto">
              A passionate educator who wants every Nigerian child to learn at a world-class level.
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </div>
  </section>
);

export default FounderStorySection;
