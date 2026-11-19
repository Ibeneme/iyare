import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { num: "15,000+", label: "learners enrolled" },
  { num: "98.2%", label: "exam pass rate" },
  { num: "40+", label: "dedicated teachers" },
  { num: "4.9 stars", label: "average rating" },
];

/** Four big numbers in soft tiles. */
const AboutStatsSection: React.FC = () => (
  <section aria-label="Yare Height by the numbers" className="pb-12">
    <div className="lp-container grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
          className={`lp-card p-6 text-center ${i % 2 ? "lp-card--yellow" : "lp-card--soft"}`}
        >
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight">{s.num}</div>
          <div className="mt-1 text-sm lp-muted">{s.label}</div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default AboutStatsSection;
