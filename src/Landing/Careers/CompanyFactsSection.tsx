import React from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Sparkles, Users } from "lucide-react";

const FACTS = [
  { icon: <Users size={22} />, label: "People on the team", value: "50+", tone: "lp-card--soft" },
  { icon: <MapPin size={22} />, label: "Places we work from", value: "5 Cities", tone: "lp-card--yellow" },
  { icon: <Heart size={22} />, label: "Students supported", value: "100,000+", tone: "lp-card--sand" },
  { icon: <Sparkles size={22} />, label: "Funding stage", value: "Seed Round", tone: "lp-card--soft" },
];

/** Four quick facts about the company. */
const CompanyFactsSection: React.FC = () => (
  <section aria-label="Company facts" className="pb-12">
    <div className="lp-container grid grid-cols-2 md:grid-cols-4 gap-4">
      {FACTS.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
          className={`lp-card ${f.tone} p-6 text-center`}
        >
          <span className="inline-block mb-2" style={{ color: "var(--lp-green-text)" }}>{f.icon}</span>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{f.value}</div>
          <div className="mt-1 text-sm lp-muted">{f.label}</div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default CompanyFactsSection;
