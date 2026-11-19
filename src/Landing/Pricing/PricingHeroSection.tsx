import React from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { HighlightWord, Plus, Ring, SectionLabel, Sparkle } from "../Shared/index";

interface Props {
  label: string;
  before: string;
  highlight: string;
  after?: string;
  subtitle: React.ReactNode;
  regionBadge?: string | null;
}

/** Page opener: label, big headline with a highlighted word, short intro and an optional region pill. */
const PricingHeroSection: React.FC<Props> = ({ label, before, highlight, after, subtitle, regionBadge }) => (
  <div className="relative text-center">
    <Sparkle className="absolute left-[6%] top-4 lp-bob hidden md:block" size={30} />
    <Ring className="absolute right-[8%] top-10 hidden md:block" />
    <Plus className="absolute left-[14%] bottom-2 hidden lg:block" />
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative">
      <SectionLabel>{label}</SectionLabel>
      <h1 className="lp-h1 mt-6 mx-auto max-w-3xl" style={{ fontSize: "clamp(2.3rem, 6vw, 4.2rem)" }}>
        {before} <HighlightWord>{highlight}</HighlightWord>
        {after ? ` ${after}` : null}
      </h1>
      <p className="lp-lead mt-5 mx-auto max-w-xl">{subtitle}</p>
      {regionBadge && (
        <span className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium lp-card">
          <Globe className="w-4 h-4" style={{ color: "var(--lp-green-text)" }} /> {regionBadge}
        </span>
      )}
    </motion.div>
  </div>
);

export default PricingHeroSection;
