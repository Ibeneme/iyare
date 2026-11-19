import React from "react";
import { motion } from "framer-motion";
import { Sparkle } from "../Shared/index";

const STATS = [
  { value: "500+", caption: "learners studying with us" },
  { value: "98%", caption: "of families see progress" },
  { value: "30+", caption: "vetted, caring teachers" },
  { value: "4.9 ★", caption: "average parent rating" },
];

/** A single row of four headline numbers. */
const StatsSection: React.FC = () => (
  <section aria-label="Yare Height in numbers" className="relative py-12 sm:py-16">
    <Sparkle className="absolute right-[6%] top-6 hidden md:block" size={30} color="var(--lp-green-mid)" />
    <div className="lp-container">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 text-center">
        {STATS.map((s, i) => (
          <motion.div key={s.caption} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <dt className="text-3xl sm:text-4xl font-semibold tracking-tight">{s.value}</dt>
            <dd className="mt-1.5 text-sm lp-muted">{s.caption}</dd>
          </motion.div>
        ))}
      </dl>
    </div>
  </section>
);

export default StatsSection;
