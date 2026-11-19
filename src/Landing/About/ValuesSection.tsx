import React from "react";
import { motion } from "framer-motion";
import { Heart, Home, Trophy } from "lucide-react";
import { SectionLabel, Squiggle } from "../Shared/index";

const VALUES = [
  { icon: <Heart size={26} />, title: "Joyful learning", desc: "Happy children learn faster and remember more.", tone: "lp-card--yellow" },
  { icon: <Trophy size={26} />, title: "Real results", desc: "Our learners regularly earn A’s and B’s in WAEC and JAMB.", tone: "lp-card--soft" },
  { icon: <Home size={26} />, title: "Happier families", desc: "No commute, more time together, and lessons that fit your day.", tone: "lp-card--sand" },
];

/** Three values we stand for. */
const ValuesSection: React.FC = () => (
  <section aria-labelledby="values-title" className="lp-section pt-0">
    <div className="lp-container">
      <div className="text-center">
        <SectionLabel tone="green" dot>What we stand for</SectionLabel>
        <h2 id="values-title" className="lp-h2 mt-5">Three things we believe in</h2>
        <Squiggle className="mx-auto mt-3" />
      </div>
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {VALUES.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`lp-card ${v.tone} p-8 text-center`}
          >
            <span className="mx-auto w-14 h-14 grid place-items-center rounded-2xl" style={{ background: "var(--lp-green)", color: "var(--lp-on-green)" }}>{v.icon}</span>
            <h3 className="lp-h3 mt-5">{v.title}</h3>
            <p className="mt-2 lp-muted">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ValuesSection;
